import TabsLayout from '../../components/TabsLayout'
export default function L() {
  return <TabsLayout tabs={[
    { name: 'index', title: 'Inicio', icon: 'grid' }, { name: 'validar', title: 'Validar', icon: 'checkmark-done' },
    { name: 'indicadores', title: 'Indicadores', icon: 'stats-chart' }, { name: 'mensajes', title: 'Mensajes', icon: 'chatbubbles' }, { name: 'perfil', title: 'Perfil', icon: 'person' }]} />
}
