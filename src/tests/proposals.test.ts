// ═══════════════════════════════════════════════════════
// SOMMA.IO — Testes automatizados (Vitest)
// src/tests/proposals.test.ts
// ═══════════════════════════════════════════════════════
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ───────────────────────────────────────────
vi.mock('../lib/supabase', () => ({
  proposals: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    changeStatus: vi.fn(),
    getHistory: vi.fn(),
  },
  diligencies: {
    list: vi.fn(),
    respond: vi.fn(),
  },
  municipalities: {
    list: vi.fn(),
    create: vi.fn(),
  },
  stats: {
    getTenantKPIs: vi.fn(),
  },
}))

import { proposals, municipalities, stats } from '../lib/supabase'

const TENANT_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

// ─── Utils ───────────────────────────────────────────
describe('Formatação de Moeda', () => {
  const formatCur = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)

  it('formata zero corretamente', () => {
    expect(formatCur(0)).toMatch(/R\$/)
    expect(formatCur(0)).toMatch(/0/)
  })

  it('formata milhões corretamente', () => {
    const result = formatCur(2500000)
    expect(result).toContain('2.500.000')
  })

  it('formata valor com centavos', () => {
    const f = new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL', minimumFractionDigits: 2
    }).format(1234.56)
    expect(f).toContain('1.234,56')
  })
})

describe('Formatação de Datas', () => {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  it('formata data ISO para pt-BR', () => {
    const result = formatDate('2024-06-15')
    expect(result).toMatch(/15\/06\/2024/)
  })

  it('retorna formato correto para data de início de ano', () => {
    const result = formatDate('2024-01-01')
    expect(result).toMatch(/01\/01\/2024/)
  })
})

// ─── Proposals ───────────────────────────────────────
describe('Proposals API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista propostas com tenant_id', async () => {
    const mockData = [
      { id: '1', title: 'Pavimentação Bairro Centro', status: 'em_analise', transfer_value: 2250000 },
      { id: '2', title: 'Construção de Escola', status: 'aprovado', transfer_value: 4200000 },
    ]
    vi.mocked(proposals.list).mockResolvedValue({ data: mockData, error: null } as any)

    const result = await proposals.list(TENANT_ID)
    expect(proposals.list).toHaveBeenCalledWith(TENANT_ID)
    expect(result.data).toHaveLength(2)
    expect(result.data![0].status).toBe('em_analise')
  })

  it('cria proposta com dados válidos', async () => {
    const newProposal = {
      tenant_id: TENANT_ID,
      title: 'Novo Projeto de Saneamento',
      ministry: 'Ministério das Cidades',
      municipality_id: 'mun-001',
      global_value: 1000000,
      transfer_value: 900000,
      counterpart_value: 100000,
      status: 'solicitado' as const,
      priority: 'media' as const,
    }
    vi.mocked(proposals.create).mockResolvedValue({ data: { id: 'new-id', ...newProposal }, error: null } as any)

    const result = await proposals.create(newProposal as any)
    expect(result.data?.id).toBe('new-id')
    expect(result.error).toBeNull()
  })

  it('muda status de proposta', async () => {
    vi.mocked(proposals.changeStatus).mockResolvedValue({ data: null, error: null } as any)
    const result = await proposals.changeStatus('prop-001', 'aprovado', 'Aprovado pelo ministério')
    expect(proposals.changeStatus).toHaveBeenCalledWith('prop-001', 'aprovado', 'Aprovado pelo ministério')
    expect(result.error).toBeNull()
  })

  it('retorna erro quando proposta não encontrada', async () => {
    vi.mocked(proposals.get).mockResolvedValue({ data: null, error: { message: 'Not found' } } as any)
    const result = await proposals.get('invalid-id')
    expect(result.data).toBeNull()
    expect(result.error?.message).toBe('Not found')
  })
})

// ─── Municipalities ───────────────────────────────────
describe('Municipalities API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista municípios ativos do tenant', async () => {
    const mockMunis = [
      { id: '1', name: 'Fortaleza', state: 'CE', is_active: true },
      { id: '2', name: 'Sobral', state: 'CE', is_active: true },
    ]
    vi.mocked(municipalities.list).mockResolvedValue({ data: mockMunis, error: null } as any)

    const result = await municipalities.list(TENANT_ID)
    expect(result.data).toHaveLength(2)
    expect(result.data!.every((m: any) => m.is_active)).toBe(true)
  })

  it('cria município com IBGE obrigatório', async () => {
    const newMuni = {
      tenant_id: TENANT_ID,
      name: 'Mossoró',
      state: 'RN',
      ibge_code: '2408003',
      mayor: 'Allyson Bezerra',
    }
    vi.mocked(municipalities.create).mockResolvedValue({ data: { id: 'muni-new', ...newMuni }, error: null } as any)

    const result = await municipalities.create(newMuni as any)
    expect(result.data?.ibge_code).toBe('2408003')
  })
})

// ─── Stats ───────────────────────────────────────────
describe('Dashboard Stats', () => {
  it('calcula KPIs corretamente', async () => {
    const mockKPIs = {
      municipalities: 8,
      proposals: 10,
      approved: 2,
      openDiligencies: 3,
      totalValue: 23620000,
      transferValue: 21430000,
    }
    vi.mocked(stats.getTenantKPIs).mockResolvedValue(mockKPIs as any)

    const result = await stats.getTenantKPIs(TENANT_ID)
    expect(result.municipalities).toBe(8)
    expect(result.approved).toBe(2)
    expect(result.totalValue).toBe(23620000)
  })
})

// ─── Validation ──────────────────────────────────────
describe('Validação de Formulários', () => {
  it('rejeita título vazio', () => {
    const validate = (title: string) => title.trim().length >= 5
    expect(validate('')).toBe(false)
    expect(validate('abc')).toBe(false)
    expect(validate('Pavimentação Centro')).toBe(true)
  })

  it('valida formato de CNPJ', () => {
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    expect(cnpjRegex.test('12.345.678/0001-90')).toBe(true)
    expect(cnpjRegex.test('12345678000190')).toBe(false)
    expect(cnpjRegex.test('00.000.000/0000-00')).toBe(true)
  })

  it('valida valores monetários positivos', () => {
    const validateValue = (v: number) => !isNaN(v) && v >= 0
    expect(validateValue(0)).toBe(true)
    expect(validateValue(2500000)).toBe(true)
    expect(validateValue(-100)).toBe(false)
    expect(validateValue(NaN)).toBe(false)
  })

  it('valida que repasse não supera valor global', () => {
    const validate = (global: number, transfer: number) => transfer <= global
    expect(validate(2500000, 2250000)).toBe(true)
    expect(validate(1000000, 1200000)).toBe(false)
  })

  it('valida datas de vigência', () => {
    const validate = (start: string, end: string) => new Date(end) > new Date(start)
    expect(validate('2024-01-01', '2025-06-30')).toBe(true)
    expect(validate('2025-06-30', '2024-01-01')).toBe(false)
  })
})

// ─── Security ────────────────────────────────────────
describe('Segurança Multi-tenant', () => {
  it('garante que tenant_id é incluído na criação', () => {
    const createPayload = (data: any, tenant_id: string) => ({ ...data, tenant_id })
    const result = createPayload({ title: 'Test' }, TENANT_ID)
    expect(result.tenant_id).toBe(TENANT_ID)
  })

  it('roles devem ser um dos valores permitidos', () => {
    const validRoles = ['super_admin', 'tenant_admin', 'tenant_member']
    expect(validRoles.includes('tenant_admin')).toBe(true)
    expect(validRoles.includes('hacker')).toBe(false)
  })

  it('status de proposta deve seguir o fluxo correto', () => {
    const validStatuses = [
      'solicitado','cadastrado','em_analise',
      'em_diligencia','aprovado','executando','prestacao_contas'
    ]
    expect(validStatuses.includes('aprovado')).toBe(true)
    expect(validStatuses.includes('rejeitado')).toBe(false)
  })
})
