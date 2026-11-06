import { ArtFormBuilderComponent, ChildFormConfig, FieldButtonEvent, FormActionEvent, FormConfig } from '@artis/ui';
import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface VenteModel {
  _id?: string;
  idSource?: string;
  idBoutique?: string;
  idClient?: string;
  designation?: string;
  date?: Date;
  status?: number;
}

export interface VenteDetailsModel {
  _id?: string;
  idMere?: string;
  idProduit?: string;
  quantite?: number;
  prixUnitaire?: number;
  remarque?: string;
  remise?: number;
}

// ── Mock data (replace with real API calls) ───────────────────
const CLIENTS = [
  { id: 'c1', nom: 'Alice Martin',  ville: 'Paris'     },
  { id: 'c2', nom: 'Bob Dupont',    ville: 'Lyon'      },
  { id: 'c3', nom: 'Charlie Blanc', ville: 'Marseille' },
];

const PRODUITS = [
  { id: 'p1', ref: 'NB-550-60', nom: 'New Balance 550 - 60', prix: 120 },
  { id: 'p2', ref: 'AF1-S-40',  nom: 'Air Force One S - 40', prix: 95  },
  { id: 'p3', ref: 'NKE-RN-42', nom: 'Nike Run - 42',         prix: 85  },
];

const STATUS_OPTIONS = [
  { value: 0, label: 'Brouillon'   },
  { value: 1, label: 'Confirmée'   },
  { value: 2, label: 'Expédiée'    },
  { value: 3, label: 'Annulée'     },
];

@Component({
  selector: 'art-form-builder-demo',
  standalone: true,
  imports: [CommonModule, ArtFormBuilderComponent],
  templateUrl: './form-builder-demo.component.html',
  styleUrl: './form-builder-demo.component.css'
})
export class FormBuilderDemoComponent {
  @ViewChild('formRef') formRef!: ArtFormBuilderComponent;

  lastEvent: any = null;

  // ── Parent form config (VenteModel) ────────────────────────
  venteFormConfig: FormConfig = {
    sections: [
      {
        title: 'Informations générales',
        subtitle: 'Détails de la vente',
        icon: 'info',
        collapsed: false,
        fields: [
          {
            name: 'designation',
            label: 'Désignation',
            type: 'text',
            defaultValue: 'Vente du ' + new Date().toLocaleDateString(),
            colSpan: 8,
            customProperties: "placeholder='Ex: Vente boutique Paris'",
          },
          {
            name: 'date',
            label: 'Date',
            type: 'date',
            colSpan: 4,
            required: true,
            defaultValue: new Date().toISOString().split('T')[0],
          },
          {
            name: 'idClient',
            label: 'Client',
            type: 'autocomplete',
            colSpan: 5,
            required: true,
            defaultValue: CLIENTS[0],
            autocompleteData: CLIENTS,
            autocompleteDisplayKeys: 'nom;ville',
            // A field button to quickly open a "New Client" popup
            buttons: [
              {
                id: 'open-new-client',
                icon: 'person_add',
                label: 'Nouveau',
                tooltip: 'Créer un nouveau client',
                variant: 'default',
              },
            ],
          },
          {
            name: 'idBoutique',
            label: 'Boutique',
            type: 'select',
            colSpan: 4,
            defaultValue: 'b3',
            options: [
              { value: 'b1', label: 'Boutique Paris'     },
              { value: 'b2', label: 'Boutique Lyon'      },
              { value: 'b3', label: 'Boutique Marseille' },
            ],
          },
          {
            name: 'status',
            label: 'Statut',
            type: 'select',
            colSpan: 3,
            defaultValue: 0,
            options: STATUS_OPTIONS,
            optionValueKey: 'value',
            optionLabelKey: 'label',
          },
        ],
      },
      {
        title: 'Options avancées',
        subtitle: 'Paramètres additionnels',
        icon: 'tune',
        collapsed: true,        // collapsed by default
        fields: [
          {
            name: 'idSource',
            label: 'Source',
            type: 'select',
            colSpan: 4,
            options: [
              { value: 'web',   label: 'Site web'    },
              { value: 'store', label: 'Magasin'     },
              { value: 'phone', label: 'Téléphone'   },
            ],
            defaultValue: 'store',
          },
          {
            name: 'dateIntervalle',
            label: 'Période de livraison',
            type: 'interval',
            intervalBaseType: 'date',
            colSpan: 6,
          },
          {
            name: 'tagsVente',
            label: 'Tags',
            type: 'multiselect',
            colSpan: 6,
            options: [
              { value: 'promo',   label: 'Promotion'  },
              { value: 'urgent',  label: 'Urgent'     },
              { value: 'vip',     label: 'VIP'        },
              { value: 'export',  label: 'Export'     },
            ],
          },
          {
            name: 'couleurEtiquette',
            label: 'Couleur étiquette',
            type: 'color',
            colSpan: 2,
            defaultValue: '#EA580C',
          },
          {
            name: 'remarqueGenerale',
            label: 'Remarque',
            type: 'textarea',
            colSpan: 10,
          },
        ],
      },
    ],
    // Extra custom buttons (left of reset/save)
    extraButtons: [
      // {
      //   id: 'duplicate',
      //   label: 'Dupliquer',
      //   icon: 'content_copy',
      //   variant: 'default',
      // },
    ],
  };

  // ── Child form config (VenteDetailsModel) ──────────────────
  venteDetailsConfig: ChildFormConfig = {
    title: 'Détails de la vente',
    subtitle: '',
    icon: 'list_alt',
    defaultViewMode: 'table',
    fields: [
      {
        name: 'idProduit',
        label: 'Produit',
        type: 'autocomplete',
        colSpan: 4,
        required: true,
        autocompleteData: PRODUITS,
        autocompleteDisplayKeys: 'ref;nom',
        buttons: [
          {
            id: 'search-produit',
            icon: 'manage_search',
            tooltip: 'Recherche avancée produit',
            variant: 'default',
          },
        ],
      },
      {
        name: 'quantite',
        label: 'Quantité',
        type: 'number',
        colSpan: 2,
        required: true,
        defaultValue: 1,
        customProperties: "min='1' step='1'",
      },
      {
        name: 'prixUnitaire',
        label: 'Prix unit. HT',
        type: 'number',
        colSpan: 2,
        required: true,
        defaultValue: 0,
        customProperties: "min='0' step='0.01'",
      },
      {
        name: 'remise',
        label: 'Remise (%)',
        type: 'number',
        colSpan: 2,
        defaultValue: 0,
        customProperties: "min='0' max='100' step='1'",
      },
      {
        name: 'remarque',
        label: 'Remarque',
        type: 'text',
        colSpan: 4,
      },
    ],
    extraButtons: [
      {
        id: 'import-produits',
        label: 'Importer',
        icon: 'upload_file',
        variant: 'default',
      },
    ],
  };

  // ── Handlers ─────────────────────────────────────────────────

  onFormAction(event: FormActionEvent): void {
    this.lastEvent = event;

    if (event.buttonId === 'save') {
      const vente: VenteModel = {
        idClient:     event.parentValues['idClient']?.id,
        idBoutique:   event.parentValues['idBoutique'],
        designation:  event.parentValues['designation'],
        date:         event.parentValues['date'],
        status:       event.parentValues['status'],
        idSource:     event.parentValues['idSource'],
      };

      const details: VenteDetailsModel[] = event.childValues.map(row => ({
        idProduit:    row['idProduit']?.id,
        quantite:     Number(row['quantite']),
        prixUnitaire: Number(row['prixUnitaire']),
        remise:       Number(row['remise'] ?? 0),
        remarque:     row['remarque'] ?? '',
      }));

      console.log('💾 Vente à enregistrer:', vente);
      console.log('📦 Détails:', details);
    }

    if (event.buttonId === 'reset') {
      console.log('🔄 Formulaire réinitialisé');
    }

    if (event.buttonId === 'duplicate') {
      console.log('📋 Dupliquer la vente:', event.parentValues);
    }
  }

  onFieldButton(event: FieldButtonEvent): void {
    if (event.buttonId === 'open-new-client') {
      console.log('👤 Ouvrir popup "Nouveau client" — valeur actuelle:', event.currentFieldValue);
      // Exemple : après saisie dans la popup, injecter la valeur :
      // this.formRef.setFieldValue('idClient', { id: 'c99', nom: 'Nouveau Client', ville: 'Paris' });
    }
  }

  onChildFieldButton(event: FieldButtonEvent & { rowIndex: number }): void {
    if (event.buttonId === 'search-produit') {
      console.log(`🔍 Recherche produit pour la ligne ${event.rowIndex}`);
      // Ouvrir une popup de recherche produit, puis :
      // this.formRef.childRows[event.rowIndex]['idProduit'] = { id: 'p99', nom: '...', prix: 0 };
    }
  }
}
