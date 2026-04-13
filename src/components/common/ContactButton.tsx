import { Mail } from 'lucide-react';

const CONTACT_EMAIL = 'info@naklos.com.tr';

const ContactButton = () => {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      aria-label="E-posta ile iletişime geç"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center"
    >
      <Mail className="w-7 h-7" />
    </a>
  );
};

export default ContactButton;