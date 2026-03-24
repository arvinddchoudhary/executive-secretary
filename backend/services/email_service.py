import imaplib
import email
from email.header import decode_header
from dotenv import load_dotenv
import os

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

def connect_imap():
    import socket
    socket.setdefaulttimeout(10)
    mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
    mail.login(GMAIL_USER, GMAIL_APP_PASSWORD)
    return mail

def decode_str(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value

def fetch_unread_emails():
    try:
        mail = connect_imap()
        mail.select("inbox")

        _, message_numbers = mail.search(None, "UNSEEN")
        email_list = []

        for num in message_numbers[0].split():
            _, msg_data = mail.fetch(num, "(RFC822)")
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            subject, encoding = decode_header(msg["Subject"])[0]
            subject = decode_str(subject)

            sender = msg.get("From", "")

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    if content_type == "text/plain":
                        body = decode_str(part.get_payload(decode=True))
                        break
                    elif content_type == "text/html":
                        body = decode_str(part.get_payload(decode=True))
            else:
                body = decode_str(msg.get_payload(decode=True))

            email_list.append({
                "sender": sender,
                "subject": subject,
                "body": body
            })

            mail.store(num, "+FLAGS", "\\Seen")

        mail.logout()
        return email_list

    except Exception as e:
        print(f"IMAP error: {e}")
        return []