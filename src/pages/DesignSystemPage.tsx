import { motion } from 'framer-motion';
import { BookOpenText, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/layout/Container';
import { Divider } from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const colorTokens = [
  { name: 'background', className: 'bg-background' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-raised', className: 'bg-surface-raised' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
  { name: 'danger', className: 'bg-danger' },
];

const typeSamples = [
  { label: 'Display', variant: 'display' as const, text: 'Reading, reframed as a beautiful competition.' },
  { label: 'Heading', variant: 'heading' as const, text: 'Built for editorial clarity and playful rivalry.' },
  { label: 'Subheading', variant: 'subheading' as const, text: 'Quiet confidence, tactile interaction, strong hierarchy.' },
  { label: 'Body', variant: 'body' as const, text: 'Read It Twin uses a highly readable body system so the future gameplay screens can stay elegant without sacrificing legibility.' },
  { label: 'Eyebrow', variant: 'eyebrow' as const, text: 'Design tokens and typography' },
  { label: 'Statistic', variant: 'stat' as const, text: '128 WPM' },
];

export function DesignSystemPage() {
  return (
    <Container className="space-y-14 py-10 sm:space-y-16 sm:py-14 lg:py-18">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
      >
        <div className="space-y-5">
          <Badge>Design system preview</Badge>
          <Text as="p" variant="eyebrow">
            Light and dark themes
          </Text>
          <Text as="h1" variant="display" className="max-w-4xl">
            Crafted as a reading environment first, with just enough competitive tension.
          </Text>
          <Text className="max-w-2xl text-muted-foreground sm:text-lg">
            The foundation favors warm paper tones, disciplined spacing, restrained motion, and semantic tokens so future product screens inherit the same mood without duplicating styles.
          </Text>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Text as="p" variant="subheading">
                Theme behavior
              </Text>
              <Text className="text-sm text-muted-foreground">Toggle, refresh, and confirm persistence.</Text>
            </div>
            <ThemeToggle />
          </div>
          <Divider className="my-5" />
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              { label: 'Spacing', value: '4px base' },
              { label: 'Radius', value: 'sm-md-lg' },
              { label: 'Shadow', value: 'soft + press' },
              { label: 'Motion', value: 'subtle' },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-border/80 bg-background/70 p-3">
                <Text as="p" variant="eyebrow" className="mb-2 text-[0.62rem]">
                  {item.label}
                </Text>
                <Text as="p" variant="subheading" className="text-base">
                  {item.value}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Text as="p" variant="eyebrow">
            Color tokens
          </Text>
          <Text as="h2" variant="heading">
            Centralized semantic palette
          </Text>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {colorTokens.map((token) => (
            <div key={token.name} className="rounded-lg border border-border bg-surface p-4 shadow-soft">
              <div className={`h-24 rounded-md border border-border ${token.className}`} />
              <div className="mt-4 space-y-1">
                <Text as="p" variant="label">
                  {token.name}
                </Text>
                <Text className="text-sm text-muted-foreground">Used semantically across components and pages.</Text>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Text as="p" variant="eyebrow">
            Typography
          </Text>
          <Text as="h2" variant="heading">
            A split between editorial presence and readable utility.
          </Text>
          <Text className="text-muted-foreground">
            Fraunces carries headlines with personality while Figtree keeps interface copy crisp and comfortable for longer reading sessions.
          </Text>
        </div>
        <div className="space-y-6 rounded-lg border border-border bg-surface p-6 shadow-soft sm:p-8">
          {typeSamples.map((sample) => (
            <div key={sample.label} className="space-y-2">
              <Text as="p" variant="eyebrow">
                {sample.label}
              </Text>
              <Text as={sample.variant === 'display' ? 'h3' : 'p'} variant={sample.variant}>
                {sample.text}
              </Text>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <Text as="p" variant="eyebrow">
            Components
          </Text>
          <Text as="h2" variant="heading">
            Reusable primitives for future product screens
          </Text>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap gap-3">
              <Button>
                <BookOpenText className="h-4 w-4" />
                Start reading
              </Button>
              <Button variant="secondary">
                <Sparkles className="h-4 w-4" />
                Invite later
              </Button>
              <Button variant="ghost">Ghost action</Button>
              <Button variant="danger">
                <ShieldAlert className="h-4 w-4" />
                Danger state
              </Button>
            </div>
            <Divider className="my-6" />
            <div className="flex flex-wrap gap-3">
              <Badge>Reader one</Badge>
              <Badge>Reader two</Badge>
              <Badge className="text-foreground">Editorial rhythm</Badge>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6 shadow-soft sm:p-8">
            <Text as="p" variant="eyebrow" className="mb-4">
              Layout notes
            </Text>
            <div className="grid gap-3">
              {[
                ['Buttons', 'Soft lift, tactile press, visible focus.'],
                ['Containers', 'Generous width with mobile-first padding.'],
                ['Borders', 'Quiet framing instead of loud cards.'],
                ['Future stats', 'Tabular numerals ready for scores and speed.'],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-md border border-border/80 bg-background/70 p-4"
                >
                  <Flame className="mt-0.5 h-4 w-4 text-accent" />
                  <div className="space-y-1">
                    <Text as="p" variant="subheading" className="text-base">
                      {title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">{copy}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
