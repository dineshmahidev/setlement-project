import api from './api'

export function getVisitorSessionId() {
  try {
    let sessionId = localStorage.getItem('lg_visitor_session')
    if (!sessionId) {
      sessionId = 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
      localStorage.setItem('lg_visitor_session', sessionId)
    }
    return sessionId
  } catch (e) {
    return 'v_' + Date.now()
  }
}

export function trackPageVisit(pageUrl, pageTitle = '') {
  try {
    const sessionId = getVisitorSessionId()
    api.post('/public/track-visit', {
      session_id: sessionId,
      page_url: pageUrl || window.location.pathname,
      page_title: pageTitle || document.title || 'Shriee Laxmi Group',
      referrer: document.referrer || '',
    }).catch(() => {
      // Silently fail if offline or tracking error
    })
  } catch (err) {
    // Ignore errors
  }
}
