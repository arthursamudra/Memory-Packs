require('dotenv').config({ path: '.env.local' });

async function createPages() {
  const domain = process.env.CONFLUENCE_DOMAIN;
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;
  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const url = `https://${domain}/wiki/rest/api/content`;

  const pages = [
    {
      title: "Employee Remote Work Policy 2026",
      content: "<h1>Remote Work Policy</h1><p>All employees are allowed to work remotely up to 3 days a week. Core hours are 10 AM to 3 PM EST. All remote work must be conducted on company-issued VPNs to ensure data security. HR must approve any full-time remote requests.</p>"
    },
    {
      title: "Insider Trading and Stock Protocol",
      content: "<h1>Insider Trading Protocol</h1><p>Employees in the finance and advisory departments are strictly prohibited from trading any securities on the Restricted List. Pre-clearance from the Compliance Officer is required for all personal trades exceeding $10,000. Violations of this policy will result in immediate termination.</p>"
    },
    {
      title: "Data Privacy and GDPR Handling",
      content: "<h1>Data Privacy Rules</h1><p>Customer PII (Personally Identifiable Information) must never be stored on local machines. Any export of customer data requires encryption at rest and in transit. In accordance with GDPR, all data deletion requests must be honored within 30 days. Contact the Legal department for any data breach incidents.</p>"
    }
  ];

  for (const page of pages) {
    const payload = {
      type: "page",
      title: page.title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: page.content,
          representation: "storage"
        }
      }
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        console.log(`Successfully created page: ${page.title}`);
      } else {
        console.log(`Failed to create page: ${page.title}`);
        console.log(data);
      }
    } catch (err) {
      console.error(err);
    }
  }
}

createPages();
