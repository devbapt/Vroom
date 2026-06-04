import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg:       '#140102',
  bgCard:   '#1F0808',
  accent:   '#E50914',
  white:    '#FFFFFF',
  whiteSoft:'rgba(255,255,255,0.7)',
  muted:    'rgba(255,255,255,0.45)',
  border:   'rgba(255,255,255,0.12)',
};

type Tab = 'mentions' | 'cgu' | 'confidentialite';

const TABS: { key: Tab; label: string }[] = [
  { key: 'mentions',       label: 'Mentions légales' },
  { key: 'cgu',            label: 'CGU' },
  { key: 'confidentialite', label: 'Données' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={styles.para}>{children}</Text>;
}

function MentionsContent() {
  return (
    <>
      <Section title="Éditeur de l'application">
        <Para>L'application Vroom est éditée par :</Para>
        <Para>{"Vroom SAS\nSiège social : France\nEmail : legal@vroom-app.fr"}</Para>
      </Section>
      <Section title="Directeur de la publication">
        <Para>Le directeur de la publication est le représentant légal de Vroom SAS.</Para>
      </Section>
      <Section title="Hébergement">
        <Para>{"L'application est hébergée par :\nSupabase Inc.\n970 Toa Payoh North, Singapour\nSite : supabase.com"}</Para>
      </Section>
      <Section title="Propriété intellectuelle">
        <Para>Tous les éléments de l'application Vroom (logo, design, code, textes) sont protégés par le droit de la propriété intellectuelle et appartiennent à Vroom SAS ou à leurs auteurs respectifs.</Para>
      </Section>
      <Section title="Contact">
        <Para>Pour toute question : contact@vroom-app.fr</Para>
      </Section>
    </>
  );
}

function CguContent() {
  return (
    <>
      <Section title="1. Objet">
        <Para>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application mobile Vroom, réseau social dédié aux passionnés d'automobile.</Para>
      </Section>
      <Section title="2. Accès au service">
        <Para>L'utilisation de Vroom est réservée aux personnes de 16 ans et plus. L'inscription est gratuite et nécessite la création d'un compte avec un email valide et un nom d'utilisateur unique.</Para>
      </Section>
      <Section title="3. Contenu utilisateur">
        <Para>En publiant du contenu sur Vroom, vous accordez à Vroom SAS une licence non exclusive d'utilisation à des fins de fourniture du service. Vous restez propriétaire de vos contenus.</Para>
        <Para>{"Sont interdits :\n• Contenus illicites, haineux ou diffamatoires\n• Usurpation d'identité\n• Spam ou contenu publicitaire non autorisé\n• Atteinte aux droits de tiers"}</Para>
      </Section>
      <Section title="4. Responsabilité">
        <Para>Vroom SAS ne peut être tenu responsable des contenus publiés par les utilisateurs. Nous nous réservons le droit de supprimer tout contenu contraire aux présentes CGU.</Para>
      </Section>
      <Section title="5. Résiliation">
        <Para>Vous pouvez supprimer votre compte à tout moment depuis les Paramètres > Compte. La résiliation entraîne la suppression de vos données dans les délais prévus par notre politique de confidentialité.</Para>
      </Section>
      <Section title="6. Droit applicable">
        <Para>Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux juridictions compétentes de Paris.</Para>
      </Section>
    </>
  );
}

function ConfidentialiteContent() {
  return (
    <>
      <Section title="Responsable du traitement">
        <Para>{"Vroom SAS\nEmail DPO : dpo@vroom-app.fr"}</Para>
      </Section>
      <Section title="Données collectées">
        <Para>{"• Identité : email, nom d'utilisateur, photo de profil\n• Véhicules : marque, modèle, année, photos\n• Publications : photos, descriptions, localisation\n• Messages privés : contenu des conversations\n• Données techniques : identifiant de session, adresse IP"}</Para>
      </Section>
      <Section title="Finalités du traitement">
        <Para>{"• Création et gestion de votre compte\n• Affichage du feed et des profils\n• Fonctionnalités de messagerie\n• Amélioration du service\n• Sécurité et lutte contre la fraude"}</Para>
      </Section>
      <Section title="Durée de conservation">
        <Para>{"• Données de compte : jusqu'à suppression du compte + 30 jours\n• Publications et commentaires : jusqu'à suppression + 30 jours\n• Messages : 2 ans à compter de leur envoi\n• Données techniques : 12 mois\n• Après fermeture du compte : suppression définitive sous 30 jours"}</Para>
      </Section>
      <Section title="Vos droits (RGPD)">
        <Para>{"Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :\n\n• Droit d'accès : obtenir une copie de vos données\n• Droit de rectification : corriger vos données inexactes\n• Droit à l'effacement : supprimer vos données (\"droit à l'oubli\")\n• Droit à la portabilité : recevoir vos données dans un format structuré\n• Droit d'opposition : vous opposer à certains traitements\n• Droit à la limitation : restreindre le traitement de vos données"}</Para>
        <Para>Pour exercer ces droits : dpo@vroom-app.fr</Para>
        <Para>En cas de non-réponse sous 30 jours, vous pouvez adresser une réclamation à la CNIL (www.cnil.fr).</Para>
      </Section>
      <Section title="Partage des données">
        <Para>{"Nous ne vendons jamais vos données. Elles peuvent être partagées uniquement avec :\n• Supabase (hébergeur et base de données)\n• Autorités compétentes si requis par la loi"}</Para>
      </Section>
      <Section title="Cookies & traceurs">
        <Para>L'application n'utilise que des cookies techniques strictement nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ni tracker tiers.</Para>
      </Section>
    </>
  );
}

export default function LegalScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('mentions');

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Informations légales</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.lastUpdated}>Mis à jour le 01/01/2025</Text>
        {activeTab === 'mentions'        && <MentionsContent />}
        {activeTab === 'cgu'             && <CguContent />}
        {activeTab === 'confidentialite' && <ConfidentialiteContent />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.white },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  tabItem: {
    flex: 1, paddingVertical: 11, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: C.accent },
  tabLabel:      { fontSize: 11, fontWeight: '600', color: C.muted },
  tabLabelActive: { color: C.white },

  content:     { paddingHorizontal: 20, paddingVertical: 20, paddingBottom: 60 },
  lastUpdated: { fontSize: 10, color: C.muted, marginBottom: 20, letterSpacing: 0.3 },

  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.accent, marginBottom: 8, letterSpacing: 0.3 },
  para: {
    fontSize: 13, color: C.whiteSoft, lineHeight: 20,
    marginBottom: 8,
  },
});
