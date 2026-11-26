import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useT } from '../lib/auth'

export type TabDef = { name: string; title: string; icon: any }
export default function TabsLayout({ tabs }: { tabs: TabDef[] }) {
  const t = useT()
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: t.surface }, headerTintColor: t.text, headerShadowVisible: false, headerTitleStyle: { fontWeight: '700' },
      tabBarActiveTintColor: t.primary, tabBarInactiveTintColor: t.muted, tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      {tabs.map((x) => (
        <Tabs.Screen key={x.name} name={x.name} options={{ title: x.title, tabBarIcon: ({ color, size }) => <Ionicons name={x.icon} size={size} color={color} /> }} />
      ))}
    </Tabs>
  )
}
