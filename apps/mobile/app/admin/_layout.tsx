import TabsLayout from '../../components/TabsLayout'
export default function L() {
  return <TabsLayout tabs={[
    { name: 'index', title: 'Inicio', icon: 'grid' }, { name: 'aprobaciones', title: 'Aprobaciones', icon: 'checkmark-done' },
    { name: 'reportes', title: 'Reportes', icon: 'stats-chart' }, { name: 'mensajes', title: 'Mensajes', icon: 'chatbubbles' }, { name: 'perfil', title: 'Más', icon: 'menu' }]} />
}
