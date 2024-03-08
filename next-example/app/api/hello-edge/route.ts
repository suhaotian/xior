import { http } from '@/app/http';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
  const { data, fromCache } = await http.get('https://google.com');
  if (fromCache) {
    console.log('data from cache!');
  }
  return new Response(`Hello from ${process.env.VERCEL_REGION} ${data.length}`);
}
