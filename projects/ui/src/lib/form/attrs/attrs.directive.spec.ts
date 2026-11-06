import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ArtAttrsDirective } from './attrs.directive';

@Component({ standalone: true, imports: [ArtAttrsDirective], template: `<input [artAttrs]="attrs" />` })
class Host { attrs = ''; }

describe('ArtAttrsDirective', () => {
  const render = (attrs: string) => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.attrs = attrs;
    f.detectChanges();
    return f.nativeElement.querySelector('input') as HTMLInputElement;
  };
  it('applique min/max/readonly/style', () => {
    const i = render("min='0' max=\"10\" readonly style='color:red'");
    expect(i.getAttribute('min')).toBe('0');
    expect(i.getAttribute('max')).toBe('10');
    expect(i.hasAttribute('readonly')).toBe(true);
    expect(i.getAttribute('style')).toBe('color:red');
  });
  it('sécurité : refuse les gestionnaires d’événements et javascript:', () => {
    const i = render("onclick='alert(1)' onfocus=\"x()\" srcdoc='<script>' formaction='javascript:alert(1)' min='1'");
    expect(i.hasAttribute('onclick')).toBe(false);
    expect(i.hasAttribute('onfocus')).toBe(false);
    expect(i.hasAttribute('srcdoc')).toBe(false);
    expect(i.hasAttribute('formaction')).toBe(false);
    expect(i.getAttribute('min')).toBe('1');
  });
});
