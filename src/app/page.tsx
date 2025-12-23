import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLeaderboard } from '@/server/data';
import { LeaderboardReveal } from '@/components/home/LeaderboardReveal';
import Aurora from '@/frontend/components/Aurora';
import GradientText from '@/frontend/components/GradientText'


const features = [
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: 'Community Powered',
    description: 'Civic Lens empowers you to be the eyes and ears of your neighborhood. Report issues like potholes, broken lights, or sanitation problems directly to those who can fix them. Collaborate with neighbors to upvote and prioritize what matters most.',
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: 'Transparent & Verifiable',
    description: 'We believe in absolute transparency. Every reported issue and its resolution status is recorded on an immutable blockchain ledger. This ensures that records cannot be tampered with and authorities remain accountable.',
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    title: 'Earn Rewards',
    description: 'Your civic engagement shouldn\'t go unnoticed. Earn "Civic Points" for every verified report and upvote. Climb the "Local Heroes" leaderboard and redeem points for community recognition and potential cryptocurrency rewards.',
  }
];

export default async function WelcomePage() {
  const leaderboardEntries = await getLeaderboard();

  return (
    <>
      <div className="space-y-20">
        <div className="absolute inset-0 z-0 pointer-events-none">
            <Aurora
              colorStops={["#4F46E5", "#9333EA", "#DB2777"]}
              blend={1.5}
              amplitude={1.2}
              speed={0.8}
            />
        </div>
        <section className="relative overflow-hidden text-center">
          
          <div className="relative z-10 px-4 sm:px-8 lg:px-20 py-16 -mt-12 sm:-mt-16">
            <div className="flex flex-col items-center justify-center gap-2 mb-6 ">
              <GradientText
                colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#02386E"]}
                animationSpeed={10}
                showBorder={false}
                className="text-7xl md:text-9xl font-bold"
              >
                Civic Lens
              </GradientText>
              <span className="text-xl md:text-2xl font-light text-muted-foreground uppercase tracking-widest">
                Empowering Communities
              </span>
            </div>

            <p className="max-w-3xl mx-auto mt-6 text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Welcome to the future of civic engagement. <strong>Civic Lens</strong> is a
              decentralized platform that bridges the gap between citizens and local
              authorities. By combining the power of community reporting with blockchain
              verifiability, we ensure that every voice is heard, every issue is tracked,
              and real change is delivered.
            </p>

            <div className="mt-10 flex flex-col items-center gap-6">
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="h-12 px-8 text-lg">
                  <Link href="/issues">Explore the Public Square</Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-lg">
                  <Link href="/report">Report an Issue Now</Link>
                </Button>
              </div>

              <LeaderboardReveal entries={leaderboardEntries} />
            </div>
          </div>
        </section>


        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-headline">Why Civic Lens?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-5 rounded-full w-fit mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-2xl font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 font-headline">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              We are on a mission to create safer, cleaner, and more responsive cities. By leveraging cutting-edge technology like <strong>Artificial Intelligence</strong> for issue categorization and <strong>Blockchain</strong> for trust, we are building a digital infrastructure for the modern citizen. Join us in transforming our shared spaces, one report at a time.
            </p>
          </div>
        </section>

        <section className="text-center py-16 lg:py-24 bg-primary/5 rounded-3xl mx-4">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold font-headline mb-4">Ready to Make a Difference?</h2>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-8">
              Join thousands of local heroes who are already improving their neighborhoods. It only takes a minute to get started.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="px-8">
                <Link href="/create-account">Create Free Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}