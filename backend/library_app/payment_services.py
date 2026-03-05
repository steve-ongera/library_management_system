"""
Payment Gateway Services
Handles M-Pesa Daraja, PayPal, and Stripe integrations.
"""
import requests
import base64
import json
import stripe
import paypalrestsdk
from datetime import datetime
from django.conf import settings


# ─── M-Pesa (Safaricom Daraja) ─────────────────────────────────────────────────

class MpesaService:
    BASE_URL = "https://sandbox.safaricom.co.ke"  # Change to production URL in prod

    @staticmethod
    def get_access_token():
        consumer_key = settings.MPESA_CONSUMER_KEY
        consumer_secret = settings.MPESA_CONSUMER_SECRET
        credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
        response = requests.get(
            f"{MpesaService.BASE_URL}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {credentials}"}
        )
        return response.json().get("access_token")

    @staticmethod
    def get_password():
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        raw = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
        password = base64.b64encode(raw.encode()).decode()
        return password, timestamp

    @staticmethod
    def initiate_stk_push(phone: str, amount: float, reference: str):
        token = MpesaService.get_access_token()
        password, timestamp = MpesaService.get_password()

        # Normalize phone number to 254XXXXXXXXX
        phone = phone.strip().replace("+", "").replace(" ", "")
        if phone.startswith("0"):
            phone = "254" + phone[1:]

        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": f"LIB-{reference[:12]}",
            "TransactionDesc": "Library Fine Payment",
        }

        response = requests.post(
            f"{MpesaService.BASE_URL}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        )
        data = response.json()
        data['transaction_id'] = data.get('CheckoutRequestID', '')
        return data


# ─── PayPal ────────────────────────────────────────────────────────────────────

class PayPalService:
    @staticmethod
    def configure():
        paypalrestsdk.configure({
            "mode": settings.PAYPAL_MODE,  # "sandbox" or "live"
            "client_id": settings.PAYPAL_CLIENT_ID,
            "client_secret": settings.PAYPAL_CLIENT_SECRET,
        })

    @staticmethod
    def create_order(amount: float, reference: str, return_url: str, cancel_url: str):
        PayPalService.configure()
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {"payment_method": "paypal"},
            "redirect_urls": {
                "return_url": return_url or settings.PAYPAL_RETURN_URL,
                "cancel_url": cancel_url or settings.PAYPAL_CANCEL_URL,
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Library Fine",
                        "sku": reference,
                        "price": f"{amount:.2f}",
                        "currency": "USD",
                        "quantity": 1,
                    }]
                },
                "amount": {"total": f"{amount:.2f}", "currency": "USD"},
                "description": f"Library fine payment - Ref: {reference}",
            }],
        })
        if payment.create():
            approval_url = next(
                (link.href for link in payment.links if link.rel == "approval_url"), None
            )
            return {"id": payment.id, "approval_url": approval_url, "transaction_id": payment.id}
        raise Exception(payment.error)

    @staticmethod
    def execute_payment(payment_id: str, payer_id: str):
        PayPalService.configure()
        payment = paypalrestsdk.Payment.find(payment_id)
        if payment.execute({"payer_id": payer_id}):
            return {"success": True, "transaction_id": payment_id}
        raise Exception(payment.error)


# ─── Stripe ────────────────────────────────────────────────────────────────────

class StripeService:
    @staticmethod
    def create_payment_intent(amount, reference: str):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        # Amount in smallest currency unit (cents for USD, cents for KES)
        amount_cents = int(float(amount) * 100)
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="kes",
            metadata={"reference": reference},
            description=f"Library Fine Payment - {reference}",
        )
        return {
            "client_secret": intent.client_secret,
            "id": intent.id,
            "transaction_id": intent.id,
        }

    @staticmethod
    def confirm_payment_intent(payment_intent_id: str):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return {"status": intent.status, "transaction_id": payment_intent_id}