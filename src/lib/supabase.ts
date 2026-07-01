// ═══════════════════════════════════════════════════════════════════
// SOMMA.IO — Camada de Integração Frontend ↔ Supabase
// Arquivo: src/lib/supabase.ts
// ═══════════════════════════════════════════════════════════════════
//
// INSTALAÇÃO:
//   npm install @supabase/supabase-js
//
// VARIÁVEIS DE AMBIENTE (.env):
//   VITE_SUPABASE_URL=https://hofeovybrlhlejeidjpv.supabase.co
//   VITE_SUPABASE_ANON_KEY=sb_publishable_SFBved61Bspnf-DhnxxmoA__smxQcKv
//
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

// ── CLIENTE SUPABASE ────────────────────────────────────────────────
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// ── TIPOS ───────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_member'
export type ProposalStatus =
  | 'solicitado' | 'cadastrado' | 'em_analise'
  | 'em_diligencia' | 'aprovado' | 'executando' | 'prestacao_contas'
export type Priority = 'baixa' | 'media' | 'alta' | 'urgente'
export type DiligencyStatus = 'aberta' | 'em_andamento' | 'respondida' | 'encerrada'

export interface Tenant {
  id: string; name: string; type: 'escritorio' | 'osc'
  cnpj?: string; email?: string; phone?: string
  city?: string; state?: string
  plan: 'basico' | 'profissional' | 'enterprise'
  plan_status: 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at?: string; created_at: string
}

export interface User {
  id: string; tenant_id: string; name: string
  email: string; phone?: string; role: UserRole
  avatar_url?: string; is_active: boolean; last_login?: string
}

export interface Municipality {
  id: string; tenant_id: string; name: string; state: string
  ibge_code?: string; mayor?: string; population?: number
  email?: string; phone?: string; is_active: boolean
}

export interface Proposal {
  id: string; tenant_id: string; municipality_id: string
  number?: string; title: string; object?: string
  ministry: string; parliamentarian?: string
  global_value: number; transfer_value: number; counterpart_value: number
  status: ProposalStatus; priority: Priority
  start_date?: string; end_date?: string
  transferegov_url?: string; assigned_user_id?: string; notes?: string
  created_at: string; updated_at: string
  // joins
  municipality?: Municipality
  assigned_user?: User
}

export interface Diligency {
  id: string; tenant_id: string; proposal_id: string
  title: string; description?: string
  source: 'ministerio' | 'parlamentar' | 'interno'
  requested_by?: string; status: DiligencyStatus; priority: Priority
  due_date?: string; response?: string; responded_at?: string
  assigned_to?: string; created_at: string
  proposal?: Proposal
}

export interface Document {
  id: string; tenant_id: string; proposal_id?: string
  name: string; category: string; storage_path: string
  mime_type?: string; size_bytes?: number
  uploaded_by?: string; created_at: string
  uploader?: User
}

export interface Notification {
  id: string; user_id: string; tenant_id: string
  type: string; title: string; body?: string
  metadata: Record<string, any>; is_read: boolean; created_at: string
}

// ═══════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════

export const auth = {
  /** Login com email + senha */
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  /** Cadastro de novo usuário */
  signUp: (email: string, password: string, name: string) =>
    supabase.auth.signUp({ email, password, options: { data: { name } } }),

  /** Logout */
  signOut: () => supabase.auth.signOut(),

  /** Sessão atual */
  getSession: () => supabase.auth.getSession(),

  /** Ouvir mudanças de auth */
  onAuthChange: (cb: (session: any) => void) =>
    supabase.auth.onAuthStateChange((_event, session) => cb(session)),

  /** Reset de senha */
  resetPassword: (email: string) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
}

// ═══════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════

export const users = {
  /** Perfil do usuário logado */
  getCurrent: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('users').select('*').eq('id', user.id).single()
    return data
  },

  /** Atualizar perfil */
  update: (id: string, payload: Partial<User>) =>
    supabase.from('users').update(payload).eq('id', id),

  /** Listar membros do tenant */
  listByTenant: (tenant_id: string) =>
    supabase.from('users').select('*').eq('tenant_id', tenant_id),
}

// ═══════════════════════════════════════════════════════════════════
// MUNICIPALITIES
// ═══════════════════════════════════════════════════════════════════

export const municipalities = {
  list: (tenant_id: string) =>
    supabase.from('municipalities')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .order('name'),

  get: (id: string) =>
    supabase.from('municipalities').select('*').eq('id', id).single(),

  create: (data: Omit<Municipality, 'id'>) =>
    supabase.from('municipalities').insert(data).select().single(),

  update: (id: string, data: Partial<Municipality>) =>
    supabase.from('municipalities').update(data).eq('id', id),

  delete: (id: string) =>
    supabase.from('municipalities').update({ is_active: false }).eq('id', id),
}

// ═══════════════════════════════════════════════════════════════════
// PROPOSALS
// ═══════════════════════════════════════════════════════════════════

export const proposals = {
  list: (tenant_id: string, filters?: {
    status?: ProposalStatus; ministry?: string; municipality_id?: string
  }) => {
    let q = supabase.from('proposals')
      .select(`*, municipality:municipalities(name,state), assigned_user:users(name,email)`)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })

    if (filters?.status)        q = q.eq('status', filters.status)
    if (filters?.ministry)      q = q.ilike('ministry', `%${filters.ministry}%`)
    if (filters?.municipality_id) q = q.eq('municipality_id', filters.municipality_id)

    return q
  },

  get: (id: string) =>
    supabase.from('proposals')
      .select(`*, municipality:municipalities(*), assigned_user:users(name,email)`)
      .eq('id', id).single(),

  create: (data: Omit<Proposal, 'id'|'created_at'|'updated_at'>) =>
    supabase.from('proposals').insert(data).select().single(),

  update: (id: string, data: Partial<Proposal>) =>
    supabase.from('proposals').update(data).eq('id', id),

  changeStatus: async (id: string, status: ProposalStatus, notes?: string) => {
    return supabase.from('proposals').update({ status, notes }).eq('id', id)
    // O trigger `trg_proposal_status_change` grava o histórico automaticamente
  },

  getHistory: (proposal_id: string) =>
    supabase.from('proposal_status_history')
      .select(`*, changed_by_user:users(name)`)
      .eq('proposal_id', proposal_id)
      .order('created_at'),

  delete: (id: string) =>
    supabase.from('proposals').delete().eq('id', id),
}

// ═══════════════════════════════════════════════════════════════════
// DILIGENCIES
// ═══════════════════════════════════════════════════════════════════

export const diligencies = {
  list: (tenant_id: string, filters?: { status?: DiligencyStatus; priority?: Priority }) => {
    let q = supabase.from('diligencies')
      .select(`*, proposal:proposals(number,title,ministry)`)
      .eq('tenant_id', tenant_id)
      .order('due_date', { ascending: true })

    if (filters?.status)   q = q.eq('status', filters.status)
    if (filters?.priority) q = q.eq('priority', filters.priority)

    return q
  },

  get: (id: string) =>
    supabase.from('diligencies')
      .select(`*, proposal:proposals(*), assigned_user:users(name)`)
      .eq('id', id).single(),

  create: (data: Omit<Diligency, 'id'|'created_at'>) =>
    supabase.from('diligencies').insert(data).select().single(),

  respond: (id: string, response: string, user_id: string) =>
    supabase.from('diligencies').update({
      response, responded_at: new Date().toISOString(),
      responded_by: user_id, status: 'respondida'
    }).eq('id', id),

  update: (id: string, data: Partial<Diligency>) =>
    supabase.from('diligencies').update(data).eq('id', id),
}

// ═══════════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════════

export const documents = {
  list: (tenant_id: string, proposal_id?: string) => {
    let q = supabase.from('documents')
      .select(`*, uploader:users(name)`)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })

    if (proposal_id) q = q.eq('proposal_id', proposal_id)
    return q
  },

  /** Upload + registro no banco */
  upload: async (
    tenant_id: string,
    proposal_id: string,
    file: File,
    category: string,
    user_id: string
  ) => {
    const path = `${tenant_id}/${proposal_id}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('documents').upload(path, file)

    if (uploadError) return { error: uploadError }

    return supabase.from('documents').insert({
      tenant_id, proposal_id, name: file.name,
      category, storage_path: path,
      mime_type: file.type, size_bytes: file.size,
      uploaded_by: user_id,
    }).select().single()
  },

  /** URL assinada para download (válida 1h) */
  getUrl: (path: string) =>
    supabase.storage.from('documents').createSignedUrl(path, 3600),

  delete: async (id: string, storage_path: string) => {
    await supabase.storage.from('documents').remove([storage_path])
    return supabase.from('documents').delete().eq('id', id)
  },
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

export const notifications = {
  list: (user_id: string) =>
    supabase.from('notifications')
      .select('*').eq('user_id', user_id)
      .order('created_at', { ascending: false }).limit(50),

  markRead: (id: string) =>
    supabase.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id),

  markAllRead: (user_id: string) =>
    supabase.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user_id).eq('is_read', false),

  /** Real-time: ouvir novas notificações */
  subscribe: (user_id: string, onNew: (n: Notification) => void) =>
    supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user_id}`,
      }, payload => onNew(payload.new as Notification))
      .subscribe(),
}

// ═══════════════════════════════════════════════════════════════════
// MESSAGES (Comunicações)
// ═══════════════════════════════════════════════════════════════════

export const messages = {
  list: (tenant_id: string) =>
    supabase.from('messages')
      .select('*')
      .or(`tenant_id.eq.${tenant_id},to_tenant.eq.${tenant_id}`)
      .order('created_at', { ascending: false }),

  send: (data: { tenant_id: string; to_tenant: string; subject: string; body: string; from_user: string }) =>
    supabase.from('messages').insert(data).select().single(),

  markRead: (id: string) =>
    supabase.from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id),
}

// ═══════════════════════════════════════════════════════════════════
// TENANTS (Admin)
// ═══════════════════════════════════════════════════════════════════

export const tenants = {
  list: () =>
    supabase.from('tenants').select('*').order('name'),

  get: (id: string) =>
    supabase.from('tenants').select('*').eq('id', id).single(),

  create: (data: Omit<Tenant, 'id'|'created_at'>) =>
    supabase.from('tenants').insert(data).select().single(),

  update: (id: string, data: Partial<Tenant>) =>
    supabase.from('tenants').update(data).eq('id', id),

  suspend: (id: string) =>
    supabase.from('tenants').update({ plan_status: 'suspended' }).eq('id', id),
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════

export const stats = {
  /** KPIs do tenant logado */
  getTenantKPIs: async (tenant_id: string) => {
    const [munis, props, diligOpen] = await Promise.all([
      supabase.from('municipalities').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('is_active', true),
      supabase.from('proposals').select('id,status,global_value,transfer_value', { count: 'exact' }).eq('tenant_id', tenant_id),
      supabase.from('diligencies').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('status', 'aberta'),
    ])

    const propData = props.data || []
    const approved = propData.filter(p => p.status === 'aprovado').length
    const totalValue = propData.reduce((a, p) => a + (p.global_value || 0), 0)
    const transferValue = propData.reduce((a, p) => a + (p.transfer_value || 0), 0)

    return {
      municipalities: munis.count || 0,
      proposals: props.count || 0,
      approved,
      openDiligencies: diligOpen.count || 0,
      totalValue,
      transferValue,
    }
  },

  /** Status breakdown para gráfico de pizza */
  getStatusBreakdown: (tenant_id: string) =>
    supabase.from('proposals')
      .select('status').eq('tenant_id', tenant_id),

  /** Volume por ministério */
  getVolumeByMinistry: (tenant_id: string) =>
    supabase.from('proposals')
      .select('ministry,global_value').eq('tenant_id', tenant_id),
}
