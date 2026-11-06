import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { THEME_MODES } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const OPTIONS = [
  { value: THEME_MODES.light, label: 'Light', icon: Sun },
  { value: THEME_MODES.dark, label: 'Dark', icon: Moon },
  { value: THEME_MODES.system, label: 'System', icon: Monitor },
]

/**
 * Theme switcher: light / dark / system.
 *
 * A menu (not a toggle) because "system" is a real, distinct choice; the trigger
 * icon reflects the currently resolved appearance so the control reads correctly
 * in both themes.
 */
export function ThemeToggle({ align = 'end' }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const TriggerIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${theme === 'system' ? `system (${resolvedTheme})` : theme}. Change theme`}
        >
          <TriggerIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                {option.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
