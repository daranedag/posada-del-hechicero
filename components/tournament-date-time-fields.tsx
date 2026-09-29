import { formatChileDateTimeInput } from "@/lib/dates";

export function TournamentDateTimeFields({ name, label, defaultValue }: {
  name: "startsAt" | "deadline";
  label: string;
  defaultValue?: string;
}) {
  const local = defaultValue ? formatChileDateTimeInput(defaultValue) : "";
  const date = local ? `${local.slice(8, 10)}/${local.slice(5, 7)}/${local.slice(0, 4)}` : "";

  return (
    <fieldset className="min-w-0">
      <legend className="pdh-label mb-2">{label}</legend>
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3">
        <label className="grid min-w-0 gap-2 text-xs text-muted-foreground">
          Fecha (dd/mm/yyyy)
          <input name={`${name}Date`} type="text" required pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" maxLength={10} placeholder="dd/mm/yyyy" title="Escribe la fecha en formato dd/mm/yyyy, por ejemplo 29/09/2026." defaultValue={date} className="pdh-input min-w-0" />
        </label>
        <label className="grid min-w-0 gap-2 text-xs text-muted-foreground">
          Hora
          <input name={`${name}Time`} type="time" required defaultValue={local.slice(11)} className="pdh-input min-w-0" />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Horario de Chile.</p>
    </fieldset>
  );
}
