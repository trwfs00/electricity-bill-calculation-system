import { NumberFormatUtil } from "@/utils/NumberFormatUtil"
import { splitBill } from "@/utils/ElectricityBill"
import {
  ActionIcon, Anchor, Container, Group, MultiSelect, NumberInput,
  Paper, Select, Stack, Table, Text, TextInput, Title,
} from "@mantine/core"
import { IconDroplet, IconPlus, IconReceipt2 } from "@tabler/icons-react"
import { useMemo, useState, type FC } from "react"

type SharedCategory = "water" | "internet" | "rent" | "common" | "gas" | "other"
type SharedBillPageProps = { defaultCategory: "water" | "other" }

const CATEGORIES: { value: SharedCategory; label: string }[] = [
  { value: "water", label: "ค่าน้ำประปา · MWA" },
  { value: "internet", label: "ค่าอินเทอร์เน็ต" },
  { value: "rent", label: "ค่าเช่าที่พัก" },
  { value: "common", label: "ค่าส่วนกลาง" },
  { value: "gas", label: "ค่าแก๊ส" },
  { value: "other", label: "ค่าใช้จ่ายอื่น ๆ" },
]

const INITIAL_PEOPLE = ["โอม", "เฟรชชี่", "กฐิน", "ปอม"]
const waterProviderUrl = "https://www.mwa.co.th/"

export const SharedBillPage: FC<SharedBillPageProps> = ({ defaultCategory }) => {
  const [category, setCategory] = useState<SharedCategory>(defaultCategory === "water" ? "water" : "internet")
  const [customTitle, setCustomTitle] = useState("")
  const [amount, setAmount] = useState<number | null>(null)
  const [people, setPeople] = useState(INITIAL_PEOPLE)
  const [participants, setParticipants] = useState(INITIAL_PEOPLE)
  const [newPerson, setNewPerson] = useState("")

  const billTitle = category === "other" && customTitle.trim()
    ? customTitle.trim()
    : CATEGORIES.find(option => option.value === category)?.label ?? "ค่าใช้จ่ายอื่น ๆ"

  const shares = useMemo(() => {
    if (amount === null || amount < 0 || participants.length === 0) return []
    return splitBill(amount, 0, participants, [])
  }, [amount, participants])

  const addPerson = () => {
    const name = newPerson.trim()
    if (!name || people.includes(name)) return
    setPeople(current => [...current, name])
    setParticipants(current => [...current, name])
    setNewPerson("")
  }

  return (
    <Container size='sm'>
      <Stack>
        <Paper p='lg' radius='sm' withBorder>
          <Stack>
            <Group gap='sm'>
              {category === "water" ? <IconDroplet size={28} /> : <IconReceipt2 size={28} />}
              <div>
                <Title order={3}>หารบิล{category === "water" ? "ค่าน้ำ" : "ค่าใช้จ่าย"}</Title>
                <Text size='sm' c='dimmed'>ใส่ยอดตามบิลจริง แล้วแบ่งให้ผู้ร่วมจ่ายตามจำนวนคน</Text>
              </div>
            </Group>

            <Select
              label='ประเภทรายการ'
              data={CATEGORIES}
              value={category}
              onChange={value => {
                if (value) setCategory(value as SharedCategory)
              }}
              allowDeselect={false}
            />

            {category === "other" && (
              <TextInput
                label='ชื่อรายการ'
                placeholder='เช่น ค่าซ่อมของใช้ในบ้าน'
                value={customTitle}
                onChange={event => setCustomTitle(event.currentTarget.value)}
              />
            )}

            <NumberInput
              label='ยอดสุทธิจากบิล (บาท)'
              description='กรอกยอดที่ต้องชำระรวมภาษีและค่าบริการแล้ว'
              placeholder='0.00'
              value={amount ?? ""}
              onChange={value => setAmount(typeof value === "number" && Number.isFinite(value) ? value : null)}
              min={0}
              allowNegative={false}
              thousandSeparator
              decimalScale={2}
              fixedDecimalScale
            />

            <MultiSelect
              label='ผู้ร่วมจ่าย'
              description='ระบบหารยอดเท่ากัน และจัดสรรเศษสตางค์ให้ผลรวมตรงกับบิล'
              data={people}
              value={participants}
              onChange={setParticipants}
              placeholder='เลือกผู้ร่วมจ่าย'
              searchable
              clearable
              nothingFoundMessage='ไม่พบชื่อ'
            />

            <Group align='end' wrap='nowrap'>
              <TextInput
                label='เพิ่มผู้ร่วมจ่าย'
                placeholder='ชื่อเล่น'
                value={newPerson}
                onChange={event => setNewPerson(event.currentTarget.value)}
                onKeyDown={event => { if (event.key === "Enter") addPerson() }}
                style={{ flex: 1 }}
              />
              <ActionIcon
                aria-label='เพิ่มผู้ร่วมจ่าย'
                size={36}
                variant='filled'
                onClick={addPerson}
                disabled={!newPerson.trim() || people.includes(newPerson.trim())}
              >
                <IconPlus size={18} />
              </ActionIcon>
            </Group>

            {category === "water" && (
              <Text size='sm' c='dimmed'>
                ค่าน้ำกรุงเทพฯ นนทบุรี และสมุทรปราการออกบิลโดย{" "}
                <Anchor href={waterProviderUrl} target='_blank' rel='noreferrer'>การประปานครหลวง (MWA)</Anchor>.
                ใส่ยอดสุทธิจากบิลเพื่อให้รวมอัตราและค่าบริการจริงของบ้านคุณ
              </Text>
            )}
          </Stack>
        </Paper>

        <Paper p='md' radius='sm' withBorder>
          <Stack>
            <Title order={5}>สรุป {billTitle}</Title>
            {amount !== null && participants.length > 0 ? (
              <Table withTableBorder withColumnBorders striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ผู้ร่วมจ่าย</Table.Th>
                    <Table.Th ta='right'>จำนวนเงิน (บาท)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {shares.map(share => (
                    <Table.Tr key={share.name}>
                      <Table.Td>{share.name}</Table.Td>
                      <Table.Td ta='right'>{NumberFormatUtil.toBaht(share.total)}</Table.Td>
                    </Table.Tr>
                  ))}
                  <Table.Tr fw={700}>
                    <Table.Td>รวมทั้งสิ้น</Table.Td>
                    <Table.Td ta='right'>{NumberFormatUtil.toBaht(amount)}</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            ) : (
              <Text size='sm' c='dimmed'>กรอกยอดสุทธิและเลือกผู้ร่วมจ่ายเพื่อดูยอดต่อคน</Text>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}
