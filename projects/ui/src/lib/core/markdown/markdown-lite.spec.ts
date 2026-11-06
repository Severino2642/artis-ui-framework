import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArtMarkdownLiteComponent } from './markdown-lite.component';
import { parseMarkdownLite } from './markdown-lite';

describe('parseMarkdownLite', () => {
  it('gras, italique, lien, saut de ligne', () => {
    expect(parseMarkdownLite('a **b** *c* _d_ [e](https://x.test)\nf')).toEqual([
      { t: 'text', text: 'a ' }, { t: 'b', text: 'b' }, { t: 'text', text: ' ' }, { t: 'i', text: 'c' }, { t: 'text', text: ' ' },
      { t: 'i', text: 'd' }, { t: 'text', text: ' ' }, { t: 'a', text: 'e', href: 'https://x.test' }, { t: 'br' }, { t: 'text', text: 'f' },
    ]);
  });
  it('lien dangereux → simple texte (jamais de href javascript:)', () => {
    expect(parseMarkdownLite('[clic](javascript:alert(1))')).toEqual([{ t: 'text', text: 'clic' }]);
    expect(parseMarkdownLite('[clic](data:text/html,x)')).toEqual([{ t: 'text', text: 'clic' }]);
  });
  it('vide / null', () => { expect(parseMarkdownLite('')).toEqual([]); expect(parseMarkdownLite(null)).toEqual([]); });
  it('le HTML brut reste du texte littéral', () => {
    expect(parseMarkdownLite('<b>x</b>')).toEqual([{ t: 'text', text: '<b>x</b>' }]);
  });
});

describe('ArtMarkdownLiteComponent', () => {
  let f: ComponentFixture<ArtMarkdownLiteComponent>;
  const render = (src: string) => { f = TestBed.createComponent(ArtMarkdownLiteComponent); f.componentRef.setInput('source', src); f.detectChanges(); return f.nativeElement as HTMLElement; };

  it('rend strong / em / a (noopener) sans innerHTML', () => {
    const el = render('**gras** *it* [doc](https://a.test)');
    expect(el.querySelector('strong')?.textContent).toBe('gras');
    expect(el.querySelector('em')?.textContent).toBe('it');
    const a = el.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('https://a.test');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.getAttribute('target')).toBe('_blank');
  });
  it('XSS : une balise <script>/<img onerror> n’est jamais interprétée', () => {
    const el = render('<img src=x onerror=alert(1)><script>alert(1)</script>');
    expect(el.querySelector('img,script')).toBeNull();
    expect(el.textContent).toContain('<script>');
  });
});
