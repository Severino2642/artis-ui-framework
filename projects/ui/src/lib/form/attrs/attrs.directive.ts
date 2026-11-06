import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

/**
 * Directive: [artAttrs]
 *
 * Applies a raw HTML attribute string to the host element.
 * Usage in template: <input artAttrs="min='0' max='10' readonly style='color:red'">
 * Usage via binding: <input [artAttrs]="field.customProperties">
 */
@Directive({
  selector: '[artAttrs]',
  standalone: true,
})
export class ArtAttrsDirective implements OnChanges {
  @Input('artAttrs') attrString = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    if (!this.attrString?.trim()) return;

    /**
     * Parses patterns like:
     *   min='0'     → { min: '0' }
     *   readonly    → { readonly: '' }
     *   style='color:red; font-weight:bold'  → applied as setAttribute
     */
    const regex = /([\w-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"))?/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(this.attrString)) !== null) {
      const name  = match[1];
      const value = match[2] ?? match[3] ?? '';
      // Sécurité : la chaîne vient d'une CONFIGURATION ; on refuse tout attribut qui exécuterait du code
      // (`onclick`, `onfocus`…, `srcdoc`, `formaction`) ou une URL `javascript:`.
      if (/^on/i.test(name) || /^(srcdoc|formaction)$/i.test(name) || /^\s*javascript:/i.test(value)) continue;
      this.renderer.setAttribute(this.el.nativeElement, name, value);
    }
  }
}
