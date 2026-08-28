'use client';

import { useMemo } from 'react';
import { Country, State } from 'country-state-city';
import { LocateFixed } from 'lucide-react';

type Props = {
  address: string; city: string; region: string; country: string; postalCode: string;
  latitude: string; longitude: string; inputClass: string;
  onChange: (field: 'address'|'city'|'region'|'country'|'postalCode'|'latitude'|'longitude', value: string) => void;
  onLocate: () => void;
};

export default function BusinessLocationFields(props: Props) {
  const countries = useMemo(() => Country.getAllCountries().sort((a,b)=>a.name.localeCompare(b.name)), []);
  const selectedCountry = countries.find((item)=>item.name===props.country);
  const states = useMemo(() => selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode).sort((a,b)=>a.name.localeCompare(b.name)) : [], [selectedCountry]);
  const field = `${props.inputClass} mt-2`;
  return <div className="mt-5 grid gap-4 md:grid-cols-2">
    <label className="font-bold">Country *<select required value={props.country} onChange={(event)=>{props.onChange('country',event.target.value);props.onChange('region','');}} className={field}><option value="">Select country</option>{countries.map((country)=><option key={country.isoCode} value={country.name}>{country.flag} {country.name}</option>)}</select></label>
    <label className="font-bold">State / region{states.length>0&&' *'}<select required={states.length>0} value={props.region} onChange={(event)=>props.onChange('region',event.target.value)} disabled={!props.country} className={`${field} disabled:bg-slate-100 disabled:text-slate-400`}><option value="">{props.country ? states.length ? 'Select state / region' : 'No states listed' : 'Select a country first'}</option>{states.map((state)=><option key={`${state.countryCode}-${state.isoCode}`} value={state.name}>{state.name}</option>)}</select></label>
    <label className="font-bold">City *<input required value={props.city} onChange={(event)=>props.onChange('city',event.target.value)} placeholder="City or town" className={field}/></label>
    <label className="font-bold">Postal code<input value={props.postalCode} onChange={(event)=>props.onChange('postalCode',event.target.value)} placeholder="Optional" className={field}/></label>
    <label className="font-bold md:col-span-2">Full street address *<input required value={props.address} onChange={(event)=>props.onChange('address',event.target.value)} placeholder="Building, street, district or landmark" className={field}/></label>
    <label className="font-bold">Latitude<input type="number" step="any" min="-90" max="90" value={props.latitude} onChange={(event)=>props.onChange('latitude',event.target.value)} className={field}/></label>
    <label className="font-bold">Longitude<input type="number" step="any" min="-180" max="180" value={props.longitude} onChange={(event)=>props.onChange('longitude',event.target.value)} className={field}/></label>
    <div className="md:col-span-2"><button type="button" onClick={props.onLocate} className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-3 font-black text-primary"><LocateFixed size={18}/>Use current map location</button><p className="mt-2 text-xs text-slate-500">Coordinates power nearby-business sorting and accurate directions.</p></div>
  </div>;
}
