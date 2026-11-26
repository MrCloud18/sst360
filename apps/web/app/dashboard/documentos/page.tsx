import { PageHeader } from '@/components/ui'
import CrudModule from '@/components/CrudModule'
import { areaRef, opt } from '@/lib/fields'
export default function Page() {
  return (<><PageHeader title="Documentos SST" subtitle="Manuales, protocolos y reglamentos disponibles para los usuarios (RF-A13)" />
    <CrudModule table="documentos_sst" title="Documentos" hideTitle stamp={{ subido_por: 'uid' }} fields={[
      { key: 'titulo', label: 'Título', required: true }, { key: 'categoria', label: 'Categoría' },
      { key: 'archivo_url', label: 'Archivo (PDF)', type: 'upload', bucket: 'documentos-sst', sizeKey: 'tamano_bytes', required: true },
      { key: 'tamano_bytes', label: 'Tamaño (bytes)', readOnly: true }, { key: 'version', label: 'Versión', def: '1.0' },
      { key: 'visible_para', label: 'Visible para', type: 'select', options: opt('todos', 'area'), def: 'todos' }, areaRef()]} /></>)
}
