/**
 * Affordplan Master → sidebar sub-modules (list + add share the same field pattern as **Therapy**).
 * URLs match QA: `/dashboard/{segment}`, `/dashboard/{segment}/add`.
 */

function affordplanMasterSubmodules() {
  return [
    {
      id: "therapy",
      listPath: "/dashboard/therapy",
      addPath: "/dashboard/therapy/add",
      listUrlRe: /\/dashboard\/therapy\/?$/,
      addUrlRe: /\/dashboard\/therapy\/add$/,
      sidebarLabel: "Therapy",
      listHeadingRe: /^Therapy$/i,
      addHeadingRe: /New Therapy/i,
      nameFieldLabelRe: /Therapy Name/i,
      nameColumnHeaderRe: /^Therapy Name$/i,
    },
    {
      id: "form",
      listPath: "/dashboard/form",
      addPath: "/dashboard/form/add",
      listUrlRe: /\/dashboard\/form\/?$/,
      addUrlRe: /\/dashboard\/form\/add$/,
      sidebarLabel: "Form",
      listHeadingRe: /^Form$/i,
      addHeadingRe: /^New Form$/i,
      nameFieldLabelRe: /^Form Name$/i,
      nameColumnHeaderRe: /^Form Name$/i,
    },
    {
      id: "formUnitType",
      listPath: "/dashboard/form-unit-type",
      addPath: "/dashboard/form-unit-type/add",
      listUrlRe: /\/dashboard\/form-unit-type\/?$/,
      addUrlRe: /\/dashboard\/form-unit-type\/add$/,
      sidebarLabel: "Form/Unit Type",
      listHeadingRe: /Form.*Unit Type|Form\/Unit Type/i,
      addHeadingRe: /New Form.*Unit Type|New Form\/Unit Type/i,
      nameFieldLabelRe: /Form.*Unit Type Name|Form\/Unit Type Name/i,
      nameColumnHeaderRe: /Form.*Unit Type Name|Form\/Unit Type Name/i,
    },
    {
      id: "group",
      listPath: "/dashboard/group",
      addPath: "/dashboard/group/add",
      listUrlRe: /\/dashboard\/group\/?$/,
      addUrlRe: /\/dashboard\/group\/add$/,
      sidebarLabel: "Group",
      listHeadingRe: /^Group$/i,
      addHeadingRe: /New Group/i,
      nameFieldLabelRe: /^Group Name$/i,
      nameColumnHeaderRe: /^Group Name$/i,
    },
    {
      id: "category",
      listPath: "/dashboard/category",
      addPath: "/dashboard/category/add",
      listUrlRe: /\/dashboard\/category\/?$/,
      addUrlRe: /\/dashboard\/category\/add$/,
      sidebarLabel: "Category",
      listHeadingRe: /^Category$/i,
      addHeadingRe: /New Category/i,
      nameFieldLabelRe: /^Category Name$/i,
      nameColumnHeaderRe: /^Category Name$/i,
    },
    {
      id: "subCategory",
      listPath: "/dashboard/sub-category",
      addPath: "/dashboard/sub-category/add",
      listUrlRe: /\/dashboard\/sub-category\/?$/,
      addUrlRe: /\/dashboard\/sub-category\/add$/,
      sidebarLabel: "Sub Category",
      listHeadingRe: /Sub Category/i,
      addHeadingRe: /New Sub Category/i,
      /** Add form uses **Subcategory Name** (one word), not "Sub Category Name". */
      nameFieldLabelRe: /Subcategory Name/i,
      nameColumnHeaderRe: /Subcategory Name/i,
    },
    {
      id: "roa",
      listPath: "/dashboard/roa",
      addPath: "/dashboard/roa/add",
      listUrlRe: /\/dashboard\/roa\/?$/,
      addUrlRe: /\/dashboard\/roa\/add$/,
      sidebarLabel: "ROA",
      listHeadingRe: /^ROA$/i,
      addHeadingRe: /New ROA/i,
      nameFieldLabelRe: /^ROA Name$/i,
      nameColumnHeaderRe: /^ROA Name$/i,
    },
    {
      id: "dosageType",
      listPath: "/dashboard/dosage-type",
      addPath: "/dashboard/dosage-type/add",
      listUrlRe: /\/dashboard\/dosage-type\/?$/,
      addUrlRe: /\/dashboard\/dosage-type\/add$/,
      sidebarLabel: "Dosage Type",
      listHeadingRe: /Dosage Type/i,
      addHeadingRe: /New Dosage Type/i,
      nameFieldLabelRe: /Dosage Type Name/i,
      nameColumnHeaderRe: /Dosage Type Name/i,
    },
    {
      id: "hospitalType",
      listPath: "/dashboard/hospital-type",
      addPath: "/dashboard/hospital-type/add",
      listUrlRe: /\/dashboard\/hospital-type\/?$/,
      addUrlRe: /\/dashboard\/hospital-type\/add$/,
      sidebarLabel: "Hospital Type",
      listHeadingRe: /Hospital Type/i,
      addHeadingRe: /New Hospital Type/i,
      nameFieldLabelRe: /Hospital Type Name/i,
      nameColumnHeaderRe: /Hospital Type Name/i,
    },
    {
      id: "uom",
      listPath: "/dashboard/uom",
      addPath: "/dashboard/uom/add",
      listUrlRe: /\/dashboard\/uom\/?$/,
      addUrlRe: /\/dashboard\/uom\/add$/,
      sidebarLabel: "UOM",
      listHeadingRe: /^UOM$/i,
      addHeadingRe: /New UOM/i,
      nameFieldLabelRe: /^UOM Name$/i,
      nameColumnHeaderRe: /^UOM Name$/i,
    },
  ];
}

/**
 * @param {string} entityId
 */
function buildUniqueDisplayName(entityId) {
  return `Auto AP ${entityId} ${Date.now()}`;
}

module.exports = {
  affordplanMasterSubmodules,
  buildUniqueDisplayName,
};
