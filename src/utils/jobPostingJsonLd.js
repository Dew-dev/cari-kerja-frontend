/**
 * Build schema.org JobPosting JSON-LD from job detail API payload.
 * @param {object} job
 * @param {string} [pageUrl]
 */
export function buildJobPostingJsonLd(job, pageUrl = "") {
  if (!job || typeof job !== "object") return null;

  const description =
    stripToPlainText(job.description) ||
    stripToPlainText(job.title) ||
    "Job posting";

  const orgName = job.company_name || job.recruiter?.company_name || "Employer";
  const orgLogo = absoluteMaybe(job.avatar_url || job.logo_url || job.company_logo);
  const orgUrl = normalizeWebsite(job.company_website);

  const hiringOrganization = {
    "@type": "Organization",
    name: orgName,
  };
  if (orgLogo) hiringOrganization.logo = orgLogo;
  if (orgUrl) hiringOrganization.sameAs = orgUrl;

  const locationName =
    job.location ||
    [job.city_name, job.province_name, job.country_name].filter(Boolean).join(", ");

  const jobLocation = locationName
    ? {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.city_name || locationName,
          addressRegion: job.province_name || undefined,
          addressCountry: job.country_code || job.country_name || "ID",
        },
      }
    : undefined;

  const employmentType = mapEmploymentType(
    job.employment_type || job.employment_type_name || job.job_type,
  );

  const datePosted = toIsoDate(job.created_at || job.published_at || job.date_posted);
  const validThrough = toIsoDate(job.deadline || job.valid_through || job.expires_at);

  const currency = job.currency_code || job.currency || "IDR";
  const min = toNumber(job.salary_min);
  const max = toNumber(job.salary_max);
  let baseSalary;
  if (min != null || max != null) {
    baseSalary = {
      "@type": "MonetaryAmount",
      currency,
      value: {
        "@type": "QuantitativeValue",
        ...(min != null ? { minValue: min } : {}),
        ...(max != null ? { maxValue: max } : {}),
        unitText: "MONTH",
      },
    };
  }

  const data = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title || "Job",
    description,
    datePosted: datePosted || undefined,
    validThrough: validThrough || undefined,
    employmentType: employmentType || undefined,
    hiringOrganization,
    jobLocation,
    baseSalary,
    identifier: job.id
      ? {
          "@type": "PropertyValue",
          name: orgName,
          value: String(job.id),
        }
      : undefined,
    directApply: true,
  };

  if (pageUrl) data.url = pageUrl;

  // Drop undefined keys for cleaner JSON-LD
  return JSON.parse(JSON.stringify(data));
}

const JSON_LD_SCRIPT_ID = "job-posting-jsonld";

export function upsertJobPostingJsonLd(job, pageUrl = "") {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(JSON_LD_SCRIPT_ID);
  const payload = buildJobPostingJsonLd(job, pageUrl);
  if (!payload) {
    existing?.remove();
    return;
  }
  const el = existing || document.createElement("script");
  el.type = "application/ld+json";
  el.id = JSON_LD_SCRIPT_ID;
  el.textContent = JSON.stringify(payload);
  if (!existing) document.head.appendChild(el);
}

export function removeJobPostingJsonLd() {
  if (typeof document === "undefined") return;
  document.getElementById(JSON_LD_SCRIPT_ID)?.remove();
}

function stripToPlainText(htmlOrText) {
  if (!htmlOrText) return "";
  const raw = String(htmlOrText);
  const htmlEntities = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
  };
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&(nbsp|amp|lt|gt);/gi, (match, entity) => htmlEntities[entity.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function toNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function absoluteMaybe(path) {
  if (!path) return undefined;
  const raw = String(path).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = import.meta.env.VITE_FILE_STORAGE_URL || "";
  if (!base) return undefined;
  try {
    const origin = new URL(base).origin;
    return `${origin}${raw.startsWith("/") ? raw : `/${raw}`}`;
  } catch {
    return undefined;
  }
}

function normalizeWebsite(site) {
  if (!site) return undefined;
  const raw = String(site).trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function mapEmploymentType(raw) {
  if (!raw) return undefined;
  const s = String(raw).toLowerCase().replace(/[_\s-]+/g, " ").trim();
  if (/(full.?time|penuh.?waktu|fulltime)/.test(s)) return "FULL_TIME";
  if (/(part.?time|paruh.?waktu|parttime)/.test(s)) return "PART_TIME";
  if (/(contract|kontrak|contractor)/.test(s)) return "CONTRACTOR";
  if (/(temp|temporary|magang sementara)/.test(s)) return "TEMPORARY";
  if (/(intern|internship|magang)/.test(s)) return "INTERN";
  if (/(freelance|per.?diem)/.test(s)) return "OTHER";
  if (/(volunteer|relawan)/.test(s)) return "VOLUNTEER";
  return "OTHER";
}
