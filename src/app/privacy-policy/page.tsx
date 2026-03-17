import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | Conscious Speech Strategies",
};

export default function PrivacyPolicy() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-10">Last updated: March 17, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-700 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. Information We Collect</h2>
              <p>
                Conscious Speech Strategies (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects the following types of information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Contact information:</strong> Name, email address, and phone number provided by staff members or administrators.</li>
                <li><strong>Session data:</strong> Student session notes, goal tracking scores, and progress reports submitted by speech-language pathologists.</li>
                <li><strong>SMS messages:</strong> Text messages sent to our business phone number for the purpose of logging sessions and hours. This includes message content and any attached images (e.g., whiteboard photos).</li>
                <li><strong>Work hours:</strong> Hours logged by staff members for payroll and invoicing purposes.</li>
                <li><strong>Account credentials:</strong> Email and encrypted password for dashboard access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and operate our speech therapy practice management platform.</li>
                <li>To process SMS messages and extract session/hours data using AI-powered natural language processing.</li>
                <li>To generate invoices and track billable hours.</li>
                <li>To communicate with staff about their accounts, sessions, and schedules.</li>
                <li>To improve our services and user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. SMS/Text Messaging</h2>
              <p>
                Our SMS service allows authorized staff to log session data and work hours via text message. By texting our business number, you consent to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Receiving automated reply messages confirming your submissions.</li>
                <li>Your message content being processed by AI to extract structured data.</li>
                <li>Images sent via MMS being analyzed for handwritten notes or whiteboard content.</li>
              </ul>
              <p className="mt-3">
                <strong>Message frequency:</strong> Replies are sent only in response to your messages. We do not send unsolicited marketing messages.
              </p>
              <p className="mt-2">
                <strong>Message and data rates may apply.</strong> Contact your carrier for details.
              </p>
              <p className="mt-2">
                To stop receiving messages, text <strong>STOP</strong> at any time. For help, text <strong>HELP</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. Data Sharing</h2>
              <p>
                We do not sell, rent, or share your personal information with third parties for marketing purposes. We use the following service providers to operate our platform:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Twilio:</strong> For SMS message delivery and receipt.</li>
                <li><strong>Anthropic (Claude AI):</strong> For natural language processing of text messages. Message content is processed but not stored by the AI provider.</li>
                <li><strong>Supabase:</strong> For secure database hosting and authentication.</li>
                <li><strong>Vercel:</strong> For website hosting.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. Data Security</h2>
              <p>
                We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), secure authentication, and role-based access controls to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide our services. Session records and invoicing data may be retained as required for business and legal purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. Your Rights</h2>
              <p>
                You may request access to, correction of, or deletion of your personal data by contacting us at the email address below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">8. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
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
