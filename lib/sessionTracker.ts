// ============================================
// YIELDVERSE SESSION TRACKER - YieldVerse Portal
// ============================================

import { supabase } from './supabase'

const PROJECT_NAME = 'yieldverse'

class SessionTracker {
  private sessionId: string | null = null
  private sessionStart: number | null = null
  private isTracking = false
  private heartbeatInterval: NodeJS.Timeout | null = null

  // Détecter le type d'appareil
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown'
    const ua = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet'
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile'
    return 'desktop'
  }

  // Détecter le navigateur
  private getBrowser(): string {
    if (typeof window === 'undefined') return 'unknown'
    const ua = navigator.userAgent
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('SamsungBrowser')) return 'Samsung'
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
    if (ua.includes('Edg')) return 'Edge'
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Safari')) return 'Safari'
    return 'Unknown'
  }

  // Démarrer le tracking de session
  async startSession(userId: string): Promise<string | null> {
    if (this.isTracking) return this.sessionId

    try {
      const sessionData = {
        user_id: userId,
        project: PROJECT_NAME,
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        session_start: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select('id')
        .single()

      if (error) {
        console.warn('[SessionTracker] Table may not exist yet:', error.message)
        return null
      }

      this.sessionId = data.id
      this.sessionStart = Date.now()
      this.isTracking = true

      // Gérer la fermeture de page
      this.setupUnloadHandler()
      
      // Heartbeat toutes les 5 minutes
      this.startHeartbeat()

      console.log(`[SessionTracker] Session started: ${this.sessionId}`)
      return this.sessionId

    } catch (error) {
      console.warn('[SessionTracker] Error starting session:', error)
      return null
    }
  }

  // Terminer la session
  async endSession(): Promise<void> {
    if (!this.isTracking || !this.sessionId || !this.sessionStart) return

    try {
      const durationSeconds = Math.floor((Date.now() - this.sessionStart) / 1000)

      await supabase
        .from('user_sessions')
        .update({
          session_end: new Date().toISOString(),
          duration_seconds: durationSeconds
        })
        .eq('id', this.sessionId)

      console.log(`[SessionTracker] Session ended. Duration: ${durationSeconds}s`)
      
      this.stopHeartbeat()
      this.isTracking = false
      this.sessionId = null
      this.sessionStart = null

    } catch (error) {
      console.warn('[SessionTracker] Error ending session:', error)
    }
  }

  // Gérer fermeture de page/onglet
  private setupUnloadHandler(): void {
    if (typeof window === 'undefined') return

    const endSessionOnUnload = () => {
      if (!this.sessionId || !this.sessionStart) return
      
      const durationSeconds = Math.floor((Date.now() - this.sessionStart) / 1000)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      
      if (!supabaseUrl) return

      // Utiliser sendBeacon pour garantir l'envoi
      const payload = JSON.stringify({
        session_end: new Date().toISOString(),
        duration_seconds: durationSeconds
      })

      navigator.sendBeacon?.(
        `${supabaseUrl}/rest/v1/user_sessions?id=eq.${this.sessionId}`,
        new Blob([payload], { type: 'application/json' })
      )
    }

    window.addEventListener('beforeunload', endSessionOnUnload)
    window.addEventListener('pagehide', endSessionOnUnload)
  }

  // Heartbeat pour sessions très longues
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isTracking || !this.sessionId || !this.sessionStart) return
      
      const durationSeconds = Math.floor((Date.now() - this.sessionStart) / 1000)
      
      await supabase
        .from('user_sessions')
        .update({ duration_seconds: durationSeconds })
        .eq('id', this.sessionId)
        
    }, 5 * 60 * 1000) // Toutes les 5 minutes
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// Singleton instance
export const sessionTracker = new SessionTracker()
