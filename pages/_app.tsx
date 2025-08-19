/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { AppProps } from "next/app";
import { useEffect } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "../src/tailwind.css"; // Tailwind layers (base, components, utilities)
import "../src/index.css"; // Global styles and CSS variables

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize any global settings or web vitals reporting here
    const reportWebVitals = async (metric: any) => {
      // You can send metrics to an analytics endpoint
      console.log(metric);
    };

    // Call reportWebVitals if needed
    // reportWebVitals();
  }, []);

  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
