import models from '@/data/data-models.json'
import accountModel from '@/data/account-model.json'
import accounts from '@/data/accounts.json'
import buildingModel from '@/data/building-model.json'
import buildings from '@/data/buildings.json'
import caseModel from '@/data/case-model.json'
import cases from '@/data/cases.json'
import organizationModel from '@/data/organization-model.json'
import organizations from '@/data/organizations.json'
import patientModel from '@/data/patient-model.json'
import patients from '@/data/patients.json'
import phoneModel from '@/data/phone-model.json'
import phones from '@/data/phones.json'
import projectModel from '@/data/project-model.json'
import projects from '@/data/projects.json'
import plantModel from '@/data/plant-model.json'
import plants from '@/data/plants.json'
import policyModel from '@/data/policy-model.json'
import policies from '@/data/policies.json'
import salesPersonModel from '@/data/sales-person-model.json'
import salesPeople from '@/data/sales-people.json'
import vehicleModel from '@/data/vehicle-model.json'
import vehicles from '@/data/vehicles.json'
import type { Field, RawRecord } from '@/lib/rendering-contract'

/**
 * Central registry of sample data objects (model + records). Shared by every
 * page (Editor, UI Templates, Semantic Roles, Architecture) so the
 * catalog of data objects only has to be defined once.
 */

export { models }
export type Model = (typeof models)[number] & { fields: Field[] }

type ModelDefinition = { name: string; description: string; fields: Field[] }

export const modelSources: Record<
  string,
  { model: ModelDefinition; records: RawRecord[] }
> = {
  vehicle: {
    model: vehicleModel as unknown as ModelDefinition,
    records: vehicles as RawRecord[],
  },
  phone: {
    model: phoneModel as unknown as ModelDefinition,
    records: phones as RawRecord[],
  },
  organization: {
    model: organizationModel as unknown as ModelDefinition,
    records: organizations as RawRecord[],
  },
  'sales-person': {
    model: salesPersonModel as unknown as ModelDefinition,
    records: salesPeople as RawRecord[],
  },
  building: {
    model: buildingModel as unknown as ModelDefinition,
    records: buildings as RawRecord[],
  },
  account: {
    model: accountModel as unknown as ModelDefinition,
    records: accounts as RawRecord[],
  },
  case: {
    model: caseModel as unknown as ModelDefinition,
    records: cases as RawRecord[],
  },
  patient: {
    model: patientModel as unknown as ModelDefinition,
    records: patients as RawRecord[],
  },
  project: {
    model: projectModel as unknown as ModelDefinition,
    records: projects as RawRecord[],
  },
  policy: {
    model: policyModel as unknown as ModelDefinition,
    records: policies as RawRecord[],
  },
  plant: {
    model: plantModel as unknown as ModelDefinition,
    records: plants as RawRecord[],
  },
}

export const defaultModelId = 'plant'

export function resolveModel(modelId: string): Model {
  const metadata =
    models.find((entry) => entry.id === modelId) ??
    models.find((entry) => entry.id === defaultModelId) ??
    models[0]
  const source = modelSources[metadata.id]
  return {
    ...metadata,
    description: source.model.description,
    fields: source.model.fields,
  }
}
