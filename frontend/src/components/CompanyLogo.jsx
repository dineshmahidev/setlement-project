import { useState } from 'react'
import { companyInitials, logoSrc, resolveCompanyLogo, storedLogoPath } from '../utils/helpers'

/**
 * Renders the company logo stored in the DB. When the company has no logo (or
 * the image fails to load) it falls back to the company initials, so no
 * hardcoded image path is ever used by the UI.
 *
 * `forceShow` bypasses the "visible in website" toggle (admin master grids).
 */
export default function CompanyLogo({
  company,
  className = 'h-full w-full object-contain',
  initialsClass = 'text-[10px] font-black',
  forceShow = false,
}) {
  const src = logoSrc(forceShow ? storedLogoPath(company) : resolveCompanyLogo(company))
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = failedSrc === src

  if (!src || failed) {
    return (
      <span className={`${initialsClass} text-[#0b3558]`} title={company?.company_name || ''}>
        {companyInitials(company)}
      </span>
    )
  }

  return <img src={src} alt={company?.company_name || 'Company logo'} className={className} onError={() => setFailedSrc(src)} />
}
