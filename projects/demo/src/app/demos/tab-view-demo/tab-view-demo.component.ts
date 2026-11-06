import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from "@angular/common";
import { ArtTabViewComponent, TabConfig } from '@artis/ui';

@Component({
  selector: 'art-tab-view-demo',
  standalone: true,
  imports: [CommonModule, ArtTabViewComponent],
  templateUrl: './tab-view-demo.component.html',
  styleUrl: './tab-view-demo.component.css'
})
export class TabViewDemoComponent implements OnInit{
  ngOnInit(): void {
    console.log('TabViewDemoComponent - ngOnInit');
  }
  @ViewChild('detailsTpl',    { static: true }) detailsTpl!:    TemplateRef<any>;
  @ViewChild('arretsTpl',     { static: true }) arretsTpl!:     TemplateRef<any>;
  @ViewChild('carteTpl',      { static: true }) carteTpl!:      TemplateRef<any>;
  @ViewChild('passagersTpl',  { static: true }) passagersTpl!:  TemplateRef<any>;
  @ViewChild('documentsTpl',  { static: true }) documentsTpl!:  TemplateRef<any>;
  @ViewChild('facturationTpl',{ static: true }) facturationTpl!: TemplateRef<any>;
  @ViewChild('historiqueTpl', { static: true }) historiqueTpl!: TemplateRef<any>;


  get tabs(): TabConfig[] {
    return [
      {
        id:       'details',
        label:    'Détails',
        icon:     'info',
        template: this.detailsTpl,
      },
      {
        id:       'arrets',
        label:    'Arrêts',
        icon:     'place',
        badge:    5,
        template: this.arretsTpl,
      },
      {
        id:       'carte',
        label:    'Carte',
        icon:     'map',
        template: this.carteTpl,
      },
      {
        id:       'passagers',
        label:    'Passagers',
        icon:     'people',
        badge:    12,
        template: this.passagersTpl,
      },
      {
        id:       'documents',
        label:    'Documents',
        icon:     'folder',
        template: this.documentsTpl,
      },
      {
        id:       'facturation',
        label:    'Facturation',
        icon:     'receipt',
        template: this.facturationTpl,
      },
      {
        id:       'historique',
        label:    'Historique',
        icon:     'history',
        template: this.historiqueTpl,
      },
    ];
  }

  onTabChange(event: any): void {
    console.log('Onglet changé :', event.previousId, '→', event.currentId);
  }
}
