'use client';

export default function TargetsTable({ targets }: { targets: any[] }) {
  if (!targets || targets.length === 0) {
    return <p className="text-gray-500">No targets yet. Upload a CSV to add targets.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Events
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {targets.map((target) => {
            const hasOpened = target.events?.some((e: any) => e.event_type === 'open');
            const hasClicked = target.events?.some((e: any) => e.event_type === 'click');
            const hasSubmitted = target.events?.some((e: any) => e.event_type === 'submit');

            return (
              <tr key={target.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {target.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {target.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {target.department || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    target.sent 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {target.sent ? 'Sent' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    {hasOpened && <span className="text-blue-600">👁️</span>}
                    {hasClicked && <span className="text-yellow-600">🖱️</span>}
                    {hasSubmitted && <span className="text-red-600">📝</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}