import { motion } from 'framer-motion';
import { BookOpenText, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/layout/Container';
import { Divider } from '@/components/ui/Divider';
import { Text } from '@/components/ui/Text';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const candyTokens = [
  { name: 'yellow', className: 'bg-yellow' },
  { name: 'pale-yellow', className: 'bg-pale-yellow' },
  { name: 'orange', className: 'bg-orange' },
  { name: 'soft-orange', className: 'bg-soft-orange' },
  { name: 'pink', className: 'bg-pink' },
  { name: 'magenta', className: 'bg-magenta' },
  { name: 'soft-pink', className: 'bg-soft-pink' },
  { name: 'violet', className: 'bg-violet' },
  { name: 'periwinkle', className: 'bg-periwinkle' },
  { name: 'cyan', className: 'bg-cyan' },
  { name: 'lime', className: 'bg-lime' },
  { name: 'ink', className: 'bg-ink' },
];

const semanticTokens = [
  { name: 'background', className: 'bg-background' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-raised', className: 'bg-surface-raised' },
  { name: 'chip', className: 'bg-chip' },
  { name: 'accent', className: 'bg-accent' },
  { name: 'reading-card', className: 'bg-reading-card' },
  { name: 'success', className: 'bg-success' },
  { name: 'danger', className: 'bg-danger' },
];

const sectionTokens = [
  { name: 'sec-yellow', className: 'bg-sec-yellow' },
  { name: 'sec-pink', className: 'bg-sec-pink' },
  { name: 'sec-magenta', className: 'bg-sec-magenta' },
  { name: 'sec-cyan', className: 'bg-sec-cyan' },
  { name: 'sec-violet', className: 'bg-sec-violet' },
  { name: 'sec-plain', className: 'bg-sec-plain' },
];

const typeSamples = [
  {
    label: 'Display / Bricolage Grotesque',
    variant: 'display' as const,
    text: 'Two people. One passage.',
  },
  {
    label: 'Heading',
    variant: 'heading' as const,
    text: 'Sentence case, heavy weight, tight tracking.',
  },
  {
    label: 'Subheading',
    variant: 'subheading' as const,
    text: 'Loud shapes, quiet reading column.',
  },
  {
    label: 'Body / Plus Jakarta Sans',
    variant: 'body' as const,
    text: 'Interface copy stays medium-weight sans, never tracked uppercase, so the play screens read as quickly as the marketing page shouts.',
  },
  { label: 'Handwritten / Caveat', variant: 'hand' as const, text: 'Solo now. Multiplayer next.' },
  { label: 'Statistic', variant: 'stat' as const, text: '305 pts' },
];

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="rounded-md border-2 border-border bg-surface p-3">
      <div className={`h-16 rounded-sm border border-border ${className}`} />
      <p className="mt-3 text-[0.75rem] font-bold">{name}</p>
    </div>
  );
}

export function DesignSystemPage() {
  return (
    <Container className="space-y-14 pb-16 pt-28 sm:space-y-16 sm:pt-32">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.625, 0.05, 0, 1] }}
        className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
      >
        <div className="space-y-5">
          <Badge>Design system</Badge>
          <Text as="h1" variant="display" className="max-w-4xl">
            Candy chrome, calm reading.
          </Text>
          <Text className="max-w-2xl text-muted-foreground">
            Bright section fills, thick rounded frames and pill controls carry the marketing
            surfaces. The passage column opts out of all of it and keeps its own pair of quiet
            tokens.
          </Text>
        </div>

        <div className="rounded-lg border-2 border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Text as="p" variant="subheading">
                Theme behaviour
              </Text>
              <Text variant="small" className="text-muted-foreground">
                Toggle, refresh, confirm persistence.
              </Text>
            </div>
            <ThemeToggle />
          </div>
          <Divider className="my-5" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Radius', value: 'sm to xl' },
              { label: 'Ease', value: '0.625 0.05 0 1' },
              { label: 'Spring', value: 'plop + soft' },
              { label: 'Scroll', value: 'Lenis 0.2' },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-border bg-background p-3">
                <p className="text-[0.7rem] font-bold text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-small font-bold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="space-y-5">
        <Text as="h2" variant="heading">
          Candy palette
        </Text>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 xl:grid-cols-6">
          {candyTokens.map((token) => (
            <Swatch key={token.name} {...token} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <Text as="h2" variant="heading">
          Semantic tokens
        </Text>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {semanticTokens.map((token) => (
            <Swatch key={token.name} {...token} />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <Text as="h2" variant="heading">
          Section fills
        </Text>
        <Text className="max-w-2xl text-muted-foreground">
          These flip hardest between themes: bright candy in light, deep jewel tones in dark, so a
          full-bleed section never has to change its class names.
        </Text>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          {sectionTokens.map((token) => (
            <Swatch key={token.name} {...token} />
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Text as="h2" variant="heading">
            Typography
          </Text>
          <Text className="text-muted-foreground">
            Bricolage Grotesque carries the display sizes, Plus Jakarta Sans handles everything
            functional, and Caveat annotates in violet.
          </Text>
        </div>
        <div className="space-y-6 rounded-lg border-2 border-border bg-surface p-6 shadow-soft sm:p-8">
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
        <Text as="h2" variant="heading">
          Primitives
        </Text>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border-2 border-border bg-surface p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap gap-3">
              <Button arrow>Start reading</Button>
              <Button variant="secondary">
                <Sparkles className="h-4 w-4" />
                Invite later
              </Button>
              <Button variant="chip">Nav pill</Button>
              <Button variant="ink">
                <BookOpenText className="h-4 w-4" />
                Solid ink
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
              <Badge>Editorial rhythm</Badge>
            </div>
          </div>

          <div className="rounded-lg border-2 border-border bg-surface p-6 shadow-soft sm:p-8">
            <Text as="p" variant="eyebrow" className="mb-4">
              Motion notes
            </Text>
            <div className="grid gap-3">
              {[
                ['Buttons', 'Letters squash and spring back on hover, fine pointers only.'],
                ['Cards', 'Enter elastic, then take a nudge from pointer velocity.'],
                ['Blobs', 'Stroke weight breathes while the section is on screen.'],
                ['Reading', 'No smooth scroll, no loops, no decoration.'],
              ].map(([title, copy]) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-md border border-border bg-background p-4"
                >
                  <Flame className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="space-y-1">
                    <Text as="p" variant="label">
                      {title}
                    </Text>
                    <Text variant="small" className="text-muted-foreground">
                      {copy}
                    </Text>
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
