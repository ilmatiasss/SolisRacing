import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { ICONS } from "@/components/icons";

type ServiceValues = {
  id?: number;
  name?: string;
  summary?: string | null;
  description?: string | null;
  priceFrom?: number | null;
  duration?: string | null;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
};

/** Campos del formulario de servicio (se usa para crear y para editar). */
export function ServiceFields({ service = {} }: { service?: ServiceValues }) {
  const prefix = service.id ? `s${service.id}` : "new";
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {service.id && <input type="hidden" name="id" value={service.id} />}
      <Field label="Nombre" htmlFor={`${prefix}-name`}>
        <Input id={`${prefix}-name`} name="name" defaultValue={service.name ?? ""} required />
      </Field>
      <Field label="Ícono" htmlFor={`${prefix}-icon`}>
        <Select id={`${prefix}-icon`} name="icon" defaultValue={service.icon ?? "gauge"}>
          {Object.entries(ICONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Resumen" htmlFor={`${prefix}-summary`} className="md:col-span-2">
        <Input id={`${prefix}-summary`} name="summary" defaultValue={service.summary ?? ""} />
      </Field>
      <Field label="Descripción" htmlFor={`${prefix}-description`} optional className="md:col-span-2">
        <Textarea id={`${prefix}-description`} name="description" rows={3} defaultValue={service.description ?? ""} />
      </Field>
      <Field label="Precio desde (CLP)" htmlFor={`${prefix}-price`} optional hint="Vacío = «Cotización sin costo».">
        <Input id={`${prefix}-price`} name="priceFrom" inputMode="numeric" defaultValue={service.priceFrom ?? ""} />
      </Field>
      <Field label="Duración" htmlFor={`${prefix}-duration`} optional>
        <Input id={`${prefix}-duration`} name="duration" placeholder="Ej: 3 a 4 horas" defaultValue={service.duration ?? ""} />
      </Field>
      <Field label="Orden" htmlFor={`${prefix}-order`}>
        <Input id={`${prefix}-order`} name="sortOrder" type="number" min={0} defaultValue={service.sortOrder ?? 0} />
      </Field>
      <div className="flex items-end pb-2">
        <Checkbox name="active" defaultChecked={service.active ?? true} label="Visible en la tienda" />
      </div>
    </div>
  );
}
