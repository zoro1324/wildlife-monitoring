import { useState } from 'react';
import { MessageSquare, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { testAPI } from '../services/api';

function SMSTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    setIsSending(true);
    setError(null);
    setResult(null);
    setErrorDetails(null);

    try {
      const response = await testAPI.sendSMSTest({
        phone_number: phoneNumber.trim(),
        message: message.trim() || undefined,
      });
      setResult(response);
    } catch (err) {
      setError(err?.message || 'Failed to send SMS');
      setErrorDetails(err?.details || null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900">
          SMS Test
        </h1>
        <p className="text-gray-600 mt-1">
          Send a test SMS message to verify Twilio integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Message Details</h2>
                <p className="text-sm text-gray-500">Use international format e.g. +1234567890</p>
              </div>
            </div>

            <Input
              label="Recipient Phone Number"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={error && !phoneNumber.trim() ? error : undefined}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (optional)
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave blank to use the default test message"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              />
            </div>

            {error && phoneNumber.trim() && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSend}
              isLoading={isSending}
              leftIcon={<Send className="w-4 h-4" />}
            >
              {isSending ? 'Sending...' : 'Send SMS Test'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Result</h2>
                <p className="text-sm text-gray-500">Server response from the SMS test endpoint</p>
              </div>
            </div>

            {!result && !error && (
              <div className="text-sm text-gray-500">No request sent yet.</div>
            )}

            {result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">SMS sent successfully</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><span className="font-medium">To:</span> {result.sent_to}</div>
                  {result.message_sid && (
                    <div><span className="font-medium">Message SID:</span> {result.message_sid}</div>
                  )}
                </div>
              </div>
            )}

            {error && !result && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Message failed</span>
                </div>
                <p className="text-sm text-gray-600">{error}</p>
                {errorDetails && (
                  <pre className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SMSTest;
