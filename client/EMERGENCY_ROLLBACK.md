# Emergency Rollback Instructions

If the main page still has internal server errors, here's how to quickly rollback to a working state:

## Option 1: Disable URL Parameter Logic

In `src/app/page.tsx`, replace these lines:

```typescript
// Replace this:
const [sourceProvider, setSourceProvider] = useState<string>(getInitialSourceProvider)
const [destinationProvider, setDestinationProvider] = useState<string>(getInitialDestinationProvider)
const [selectionStep, setSelectionStep] = useState<'source' | 'destination' | 'complete'>(getInitialStep)

// With this:
const [sourceProvider, setSourceProvider] = useState<string>('spotify')
const [destinationProvider, setDestinationProvider] = useState<string>('youtube')
const [selectionStep, setSelectionStep] = useState<'source' | 'destination' | 'complete'>('source')
```

And comment out the URL sync useEffect:

```typescript
// Comment out this entire useEffect block:
/*
useEffect(() => {
  const urlSource = searchParams.get('source');
  // ... rest of the effect
}, [searchParams]);
*/
```

## Option 2: Use Git to Revert

```bash
# See recent commits
git log --oneline -5

# Revert to before URL parameter changes
git reset --hard [COMMIT_HASH_BEFORE_URL_CHANGES]
```

## Option 3: Minimal Working Version

Replace the entire page content with this minimal working version:

```typescript
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import ProviderCarousel from "@/components/ProviderCarousel"
import { DEFAULT_PROVIDERS, getProviderConnectionStatus } from "@/lib/providers"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sourceProvider, setSourceProvider] = useState<string>('spotify')
  const [destinationProvider, setDestinationProvider] = useState<string>('youtube')
  const [selectionStep, setSelectionStep] = useState<'source' | 'destination' | 'complete'>('source')

  const providersWithStatus = DEFAULT_PROVIDERS.map(provider => ({
    ...provider,
    status: getProviderConnectionStatus(provider.id, session),
  }))

  const handleSourceSelection = (providerId: string) => {
    setSourceProvider(providerId)
    setSelectionStep('destination')
  }

  const handleDestinationSelection = (providerId: string) => {
    setDestinationProvider(providerId)
    setSelectionStep('complete')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">Provider Selection</h1>
        
        {selectionStep === 'source' && (
          <ProviderCarousel
            label="Select Source Provider"
            providers={providersWithStatus}
            selectedProviderId={sourceProvider}
            onSelectionChange={handleSourceSelection}
            filters={{ capability: 'import' }}
            showStatusIndicators={true}
            allowDisconnectedSelection={true}
          />
        )}

        {selectionStep === 'destination' && (
          <ProviderCarousel
            label="Select Destination Provider"
            providers={providersWithStatus}
            selectedProviderId={destinationProvider}
            onSelectionChange={handleDestinationSelection}
            filters={{ capability: 'export', exclude: [sourceProvider] }}
            showStatusIndicators={true}
            allowDisconnectedSelection={true}
          />
        )}

        {selectionStep === 'complete' && (
          <div className="text-center">
            <h2 className="text-2xl mb-4">Ready to Migrate!</h2>
            <p>{sourceProvider} → {destinationProvider}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

This removes all URL parameter logic but keeps the ProviderCarousel functionality working.