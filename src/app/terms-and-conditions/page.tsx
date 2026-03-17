import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms and Conditions | Conscious Speech Strategies",
};

export default function TermsAndConditions() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
          <p className="text-sm text-slate-400 mb-10">Last updated: March 17, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-700 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. Overview</h2>
              <p>
                These Terms and Conditions govern your use of the Conscious Speech Strategies platform, including the admin dashboard, SMS messaging service, and associated tools (the &quot;Service&quot;). By accessing or using the Service, you agree to be bound by these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. SMS Messaging Program</h2>
              <p>
                <strong>Program name:</strong> Conscious Speech SMS Assistant
              </p>
              <p className="mt-2">
                <strong>Description:</strong> Authorized staff members can text our business number to log therapy sessions, record work hours, and receive confirmations. The system uses AI to parse natural language messages and image attachments.
              </p>
              <p className="mt-2">
                <strong>Message frequency:</strong> The system responds only to messages you send. You will receive 1-3 reply messages per text you send (parse confirmation, save confirmation, or help text). No recurring or marketing messages are sent.
              </p>
              <p className="mt-2">
                <strong>Message and data rates may apply.</strong> Check with your wireless carrier for details about your text messaging plan.
              </p>
              <p className="mt-2">
                <strong>Opt-out:</strong> Text <strong>STOP</strong> to unsubscribe from all messages at any time. You will receive a single confirmation message. After opting out, you will no longer receive any messages from this number.
              </p>
              <p className="mt-2">
                <strong>Help:</strong> Text <strong>HELP</strong> for assistance or contact info@consciousspeech.net.
              </p>
              <p className="mt-2">
                <strong>Support:</strong> For support, email info@consciousspeech.net or text HELP to our number.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. Eligibility</h2>
              <p>
                The Service is available only to authorized staff and administrators of Conscious Speech Strategies. Access is granted by an administrator who creates your account and provides login credentials.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. Acceptable Use</h2>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Use the Service only for legitimate business purposes related to speech therapy practice management.</li>
                <li>Keep your login credentials confidential and not share them with unauthorized individuals.</li>
                <li>Provide accurate information when logging sessions and hours.</li>
                <li>Comply with HIPAA and all applicable privacy regulations when handling student information.</li>
                <li>Not attempt to access accounts, data, or features you are not authorized to use.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. Privacy</h2>
              <p>
                Your use of the Service is also governed by our{" "}
                <a href="/privacy-policy" className="text-teal-600 hover:text-teal-700 underline">
                  Privacy Policy
                </a>
                , which describes how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. Disclaimer</h2>
              <p>
                The Service is provided &quot;as is&quot; without warranties of any kind. While we strive for accuracy in AI-powered message parsing, you are responsible for reviewing and confirming all parsed data before it is saved. Conscious Speech Strategies is not liable for errors in AI-interpreted data that is confirmed and saved by the user.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. Modifications</h2>
              <p>
                We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">8. Contact</h2>
              <p>
                For questions about these Terms, contact us at:
              </p>
              <p className="mt-2">
                <strong>Conscious Speech Strategies</strong><br />
                Email: info@consciousspeech.net
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
