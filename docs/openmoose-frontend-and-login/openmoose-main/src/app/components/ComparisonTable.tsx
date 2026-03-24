import { Check, X } from 'lucide-react';

const features = [
  { name: 'Active Agents', starter: '5', pro: '25', ultra: '100', enterprise: 'Unlimited' },
  { name: 'Monthly Requests', starter: '1,000', pro: '10,000', ultra: '50,000', enterprise: 'Unlimited' },
  { name: 'Team Members', starter: '1', pro: '5', ultra: '20', enterprise: 'Unlimited' },
  { name: 'API Access', starter: true, pro: true, ultra: true, enterprise: true },
  { name: 'Custom Integrations', starter: false, pro: true, ultra: true, enterprise: true },
  { name: 'Advanced Analytics', starter: false, pro: true, ultra: true, enterprise: true },
  { name: 'Priority Support', starter: false, pro: true, ultra: true, enterprise: true },
  { name: 'White-label', starter: false, pro: false, ultra: true, enterprise: true },
  { name: 'On-premise Deploy', starter: false, pro: false, ultra: false, enterprise: true },
  { name: 'SLA Guarantee', starter: false, pro: false, ultra: true, enterprise: true },
  { name: 'Dedicated Support', starter: false, pro: false, ultra: true, enterprise: true },
  { name: 'Custom Contract', starter: false, pro: false, ultra: false, enterprise: true }
];

export function ComparisonTable() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Compare
            <span className="text-gray-400"> all plans</span>
          </h2>
          <p className="text-xl text-gray-500">
            Find the perfect fit for your team's needs.
          </p>
        </div>

        <div className="overflow-x-auto bg-white rounded-3xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-6 px-8 font-semibold text-gray-900 text-sm">Features</th>
                <th className="text-center py-6 px-6 font-semibold text-gray-900 text-sm">Starter</th>
                <th className="text-center py-6 px-6 font-semibold text-gray-900 text-sm bg-gray-50">Pro</th>
                <th className="text-center py-6 px-6 font-semibold text-gray-900 text-sm">Ultra</th>
                <th className="text-center py-6 px-6 font-semibold text-gray-900 text-sm">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-8 text-gray-700 text-base font-medium">{feature.name}</td>
                  <td className="py-5 px-6 text-center">
                    {typeof feature.starter === 'boolean' ? (
                      feature.starter ? (
                        <div className="inline-flex">
                          <Check className="w-5 h-5 text-gray-900" />
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 font-semibold text-base">{feature.starter}</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center bg-gray-50">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <div className="inline-flex">
                          <Check className="w-5 h-5 text-gray-900" />
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 font-semibold text-base">{feature.pro}</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {typeof feature.ultra === 'boolean' ? (
                      feature.ultra ? (
                        <div className="inline-flex">
                          <Check className="w-5 h-5 text-gray-900" />
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 font-semibold text-base">{feature.ultra}</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {typeof feature.enterprise === 'boolean' ? (
                      feature.enterprise ? (
                        <div className="inline-flex">
                          <Check className="w-5 h-5 text-gray-900" />
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900 font-semibold text-base">{feature.enterprise}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}