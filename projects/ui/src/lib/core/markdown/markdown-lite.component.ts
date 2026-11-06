import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { parseMarkdownLite } from './markdown-lite';

/** Affiche un Markdown restreint (gras, italique, liens) sans innerHTML. */
@Component({
  selector: 'art-markdown-lite',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (n of nodes(); track $index) {@switch (n.t) {
    @case ('b') {<strong>{{ n.text }}</strong>}
    @case ('i') {<em>{{ n.text }}</em>}
    @case ('a') {<a [href]="n.href" target="_blank" rel="noopener noreferrer">{{ n.text }}</a>}
    @case ('br') {<br />}
    @default {{{ n.text }}}
  }}`,
  styles: [`a { color: var(--art-primary); text-decoration: underline; text-underline-offset: 2px; }`],
})
export class ArtMarkdownLiteComponent {
  readonly source = input<string | null | undefined>('');
  protected readonly nodes = computed(() => parseMarkdownLite(this.source()) as ({ t: string; text: string; href: string })[]);
}
