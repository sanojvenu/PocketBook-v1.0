import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://YOUR_PROJECT_ID.web.app';

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
        },
    ];
}
