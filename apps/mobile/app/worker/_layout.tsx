import TabsLayout from '../../components/TabsLayout'
export default function L() {
  return <TabsLayout tabs={[
    { name: 'index', title: 'Inicio', icon: 'home' }, { name: 'epp', title: 'EPP', icon: 'construct' },
    { name: 'capacitaciones', title: 'Capacitaciones', icon: 'school' }, { name: 'mensajes', title: 'Mensajes', icon: 'chatbubbles' }, { name: 'perfil', title: 'Perfil', icon: 'person' }]} />
}
