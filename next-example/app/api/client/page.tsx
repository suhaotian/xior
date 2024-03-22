'use client';

import { useEffect } from 'react';

import { http } from '@/app/http';

export default function ClientPage() {
  useEffect(() => {
    http.post(
      '/',
      { data: 123456 },
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }, []);
  return <div>hello</div>;
}
