import { WardClient } from '../src/client'
import { WardError } from '../src/primitives'

const VALID_ADDRESS = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const VALID_ADDRESS2 = 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe'

function makeClient(overrides: Record<string, unknown> = {}): WardClient {
  return new WardClient({
    network: 'altnet',
    institution_key: 'test-key',
    api_url: 'https://mock.wardprotocol.org',
    ...overrides,
  })
}

describe('WardClient', () => {
  describe('input validation', () => {
    it('rejects invalid vault address in registerVault', async () => {
      const client = makeClient()
      await expect(client.registerVault('not-valid')).rejects.toThrow(WardError)
    })

    it('rejects invalid depositor address in issueCredential', async () => {
      const client = makeClient()
      await expect(client.issueCredential('bad-addr')).rejects.toThrow(WardError)
    })

    it('rejects invalid vault in purchaseCoverage', async () => {
      const client = makeClient()
      await expect(
        client.purchaseCoverage('bad-vault', VALID_ADDRESS2, 1_000_000, 9999999)
      ).rejects.toThrow(WardError)
    })

    it('rejects fractional drops in purchaseCoverage', async () => {
      const client = makeClient()
      await expect(
        client.purchaseCoverage(VALID_ADDRESS, VALID_ADDRESS2, 1.5, 9999999)
      ).rejects.toThrow(WardError)
    })

    it('rejects negative drops in purchaseCoverage', async () => {
      const client = makeClient()
      await expect(
        client.purchaseCoverage(VALID_ADDRESS, VALID_ADDRESS2, -100, 9999999)
      ).rejects.toThrow(WardError)
    })

    it('rejects invalid address in getVaultHealth', async () => {
      const client = makeClient()
      await expect(client.getVaultHealth('not-r')).rejects.toThrow(WardError)
    })
  })

  describe('assertWardSignedFalse integration', () => {
    it('throws if API returns ward_signed: true', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ward_signed: true, vaults: [] }),
      }) as jest.Mock

      const client = makeClient()
      await expect(client.listVaults()).rejects.toThrow(WardError)
    })

    it('passes when API returns ward_signed: false', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ward_signed: false, vaults: [] }),
      }) as jest.Mock

      const client = makeClient()
      const vaults = await client.listVaults()
      expect(vaults).toEqual([])
    })
  })
})
