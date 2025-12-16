import { Button } from '@/frontend/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';

const features = [
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: 'Community Powered',
    description: 'Report local issues and collaborate with your community to get them resolved.',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: 'Transparent & Verifiable',
    description: 'Issue resolutions are recorded on the blockchain for ultimate transparency.',
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    title: 'Earn Rewards',
    description: 'Get rewarded with community points and cryptocurrency for your contributions.',
  }
];

export default function WelcomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-4">

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary font-headline">
              Civic Lens
            </h1>
          </div>
          <p className="max-w-2xl mx-auto mt-4 text-lg md:text-xl text-muted-foreground">
            A decentralized platform for citizens to report, track, and resolve local issues with blockchain-verified transparency and community rewards.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/issues">View Public Square</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/report">Report an Issue</Link>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 font-headline">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card/50">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="text-center py-12 lg:py-16 bg-secondary/30 rounded-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold font-headline">Ready to Make a Difference?</h2>
          <p className="mt-2 text-muted-foreground">Create an account or log in to start contributing.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Button asChild>
              <Link href="/create-account">Create Account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#">Login</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
