import { NumberFormatUtil } from "@/utils/NumberFormatUtil"
import {
  calcBillFromUsage, estimateAcCostMarginal, estimateAcCostProRata,
  getFtPeriod, getResidentialTariff, round2, splitBill, TARIFF_SOURCES,
  type ResidentialCategory,
} from "@/utils/ElectricityBill"
import {
  Accordion, ActionIcon, Alert, Anchor, Blockquote, Button, Container,
  Grid, Group, InputLabel, Modal, MultiSelect, NumberInput, Paper,
  Select, Stack, Table, TableScrollContainer, Tabs, Text, TextInput, Title, Tooltip,
} from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
import { IconAlertCircle, IconCalculator, IconPlus, IconSquareRoot2 } from "@tabler/icons-react"
import { toJpeg } from "html-to-image"
import { useMemo, useState, type FC } from "react"
import { colors } from "@/const/theme/colors"
import dayjs from "dayjs"
import SelectClasses from "./cssModules/Select.module.css"
import meaLogo from "@/assets/my-logo.png"

type FormValues = {
  billDate: string | null
  category: ResidentialCategory
  totalKwh: number | null
  preVatAmount: number | null
  discount: number | null
  acKwh: number | null
  allocateServiceProportionally: boolean
  appliances_user: string[]
  friends: string[]
  ftOverride: number | null
  serviceOverride: number | null
}

const money = NumberFormatUtil.toBaht.bind(NumberFormatUtil)
const numberOrNull = (value: string | number) =>
  typeof value === "number" && Number.isFinite(value) ? value : null

function AmountTable({ rows }: { rows: { label: string; amount: number; total?: boolean }[] }) {
  return (
    <Paper radius='sm' withBorder style={{ overflow: "hidden" }}>
      <TableScrollContainer minWidth={360} type='native'>
        <Table withColumnBorders striped>
          <Table.Thead>
            <Table.Tr><Table.Th>รายการ</Table.Th><Table.Th ta='right'>จำนวนเงิน (บาท)</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map(row => (
              <Table.Tr key={row.label} bg={row.total ? colors.main[2] : undefined} fw={row.total ? 700 : undefined}>
                <Table.Td>{row.label}</Table.Td>
                <Table.Td ta='right'>{money(row.amount)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </TableScrollContainer>
    </Paper>
  )
}

export const HomePage: FC = () => {
  const [opened, { open, close }] = useDisclosure(false)
  const [friends, setFriends] = useState(["โอม", "เฟรชชี่", "กฐิน", "ปอม"])
  const [isSaving, setIsSaving] = useState(false)
  const [method, setMethod] = useState<string | null>("marginal")
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date())

  const addFriendForm = useForm({
    initialValues: { name: "" },
    validate: {
      name: value => {
        if (!value.trim()) return "ต้องกรอกชื่อ"
        if (friends.includes(value.trim())) return "ชื่อนี้มีอยู่แล้ว"
        return null
      },
    },
  })

  const form = useForm<FormValues>({
    initialValues: {
      billDate: today, category: "standard", totalKwh: null, preVatAmount: null,
      discount: null, acKwh: null, allocateServiceProportionally: true,
      appliances_user: [], friends: [], ftOverride: null, serviceOverride: null,
    },
  })

  const month = form.values.billDate ? dayjs(form.values.billDate).format("YYYY-MM") : ""
  const period = getFtPeriod(month)
  const tariff = useMemo(() => {
    const base = getResidentialTariff(month, form.values.category)
    if (!base) return null
    return {
      ...base,
      ftPerKWh: form.values.ftOverride ?? base.ftPerKWh,
      serviceCharge: form.values.serviceOverride ?? base.serviceCharge,
    }
  }, [month, form.values.category, form.values.ftOverride, form.values.serviceOverride])

  const bill = useMemo(() => {
    try {
      if (!tariff || form.values.totalKwh === null) return null
      return calcBillFromUsage(form.values.totalKwh, tariff, form.values.discount ?? 0)
    } catch { return null }
  }, [tariff, form.values.totalKwh, form.values.discount])

  const proRata = useMemo(() => {
    try {
      const { totalKwh, preVatAmount, acKwh, discount } = form.values
      if (totalKwh === null || preVatAmount === null) return null
      return estimateAcCostProRata(
        { totalKwh, preVatAmount, vatRate: 0.07 }, acKwh ?? 0, discount ?? 0
      )
    } catch { return null }
  }, [form.values])

  const marginal = useMemo(() => {
    try {
      const { totalKwh, acKwh, allocateServiceProportionally, discount } = form.values
      if (!tariff || totalKwh === null) return null
      return estimateAcCostMarginal(totalKwh, acKwh ?? 0, tariff, allocateServiceProportionally, discount ?? 0)
    } catch { return null }
  }, [form.values, tariff])

  const activeBill = method === "proRata" ? proRata : bill
  const applianceCost = method === "proRata" ? proRata?.acTotal ?? null : marginal
  const canCalculate = activeBill !== null && applianceCost !== null && !!form.values.billDate
  const shares = canCalculate
    ? splitBill(activeBill.total, applianceCost, form.values.friends, form.values.appliances_user)
    : []
  const customRates = form.values.ftOverride !== null || form.values.serviceOverride !== null

  const addFriend = () => {
    if (addFriendForm.validate().hasErrors) return
    const name = addFriendForm.values.name.trim()
    setFriends(current => [...current, name])
    form.insertListItem("friends", name)
    addFriendForm.reset()
    close()
  }

  const saveBillAsJpeg = async () => {
    if (isSaving || !canCalculate) return
    setIsSaving(true)
    let clone: HTMLElement | null = null
    try {
      const container = document.getElementById("bill-container")
      if (!container) throw new Error("ไม่พบส่วนประกอบบิล")
      await document.fonts.ready
      clone = container.cloneNode(true) as HTMLElement
      clone.id = "bill-container-clone"
      Object.assign(clone.style, {
        width: "640px", height: "auto", overflow: "visible", margin: "0 auto",
        padding: "20px", backgroundColor: "white", position: "absolute",
        left: "0", top: "0", zIndex: "-9999",
      })
      document.body.appendChild(clone)
      const dataUrl = await toJpeg(clone, {
        quality: 0.95, pixelRatio: 2, backgroundColor: "white", width: clone.scrollWidth,
        height: clone.scrollHeight, cacheBust: true,
        filter: node => !node.classList?.contains("action-buttons"),
      })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `บิลค่าไฟฟ้า_${dayjs(form.values.billDate).format("MMMM_BBBB")}.jpg`
      link.click()
    } catch (error) {
      console.error("Error saving bill:", error)
      alert("เกิดข้อผิดพลาดในการบันทึกบิล")
    } finally {
      clone?.remove()
      setIsSaving(false)
    }
  }

  return (
    <Container size='sm' h='100%'>
      <Paper id='bill-container' p='24px' radius='sm' withBorder>
        <Stack>
          <Group justify='space-between'>
            <img src={meaLogo} alt='logo' height={80} style={{ objectFit: "contain" }} />
            <Title order={5}>ระบบคำนวณค่าไฟ MEA & หารบิล</Title>
          </Group>
          <Paper p='md' radius='sm' withBorder>
            <Stack gap='sm'>
              <Title order={6}>ข้อมูลการใช้ไฟฟ้า</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <MonthPickerInput
                    classNames={SelectClasses} label='ประจำเดือน' placeholder='เลือก'
                    value={form.values.billDate} maxDate={today} minDate='2025-09-01'
                    onChange={value => form.setValues({ billDate: value, ftOverride: null, serviceOverride: null })}
                    error={!form.values.billDate ? "กรุณาเลือกเดือนของบิล" : undefined}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Select
                    classNames={SelectClasses} label='ประเภทบ้านอยู่อาศัยตามบิล MEA'
                    data={[
                      { value: "standard", label: "ประเภท 1.2 — อัตราปกติ เกิน 150 หน่วย" },
                      { value: "small", label: "ประเภท 1.1 — อัตราปกติ ไม่เกิน 150 หน่วย" },
                    ]}
                    value={form.values.category} allowDeselect={false}
                    onChange={value => {
                      if (value === "small" || value === "standard") form.setValues({ category: value, serviceOverride: null })
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size='xs' c='dimmed'>
                    เลือกประเภทจากบิล ไม่เปลี่ยนประเภทตามหน่วยเดือนเดียว เพราะขึ้นกับขนาดมิเตอร์และประวัติการใช้ไฟด้วย
                    รองรับอัตราปกติบ้านอยู่อาศัย ไม่รวม TOU
                  </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <NumberInput
                    classNames={SelectClasses} label='ค่าบริการรายเดือน (บาท)'
                    value={tariff?.serviceCharge ?? ""} min={0} decimalScale={2} fixedDecimalScale
                    allowNegative={false} disabled={!tariff}
                    onChange={value => form.setFieldValue("serviceOverride", numberOrNull(value))}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <NumberInput
                    classNames={SelectClasses} label='ค่า Ft (บาท/หน่วย)'
                    value={tariff?.ftPerKWh ?? ""} decimalScale={4} fixedDecimalScale disabled={!tariff}
                    onChange={value => form.setFieldValue("ftOverride", numberOrNull(value))}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <NumberInput classNames={SelectClasses} label='ภาษีมูลค่าเพิ่ม (VAT)' value={7} suffix='%' readOnly />
                </Grid.Col>
                <Grid.Col span={12}>
                  {period ? (
                    <Text size='xs' c='dimmed'>
                      Ft งวด{period.label} · ตรวจสอบข้อมูล 9 ต.ค. 2569
                      {customRates ? " · ใช้ค่าที่แก้ไขเอง" : " · ใช้อัตราตามประกาศ MEA"}
                    </Text>
                  ) : (
                    <Alert color='orange' icon={<IconAlertCircle />}>
                      ยังไม่มีอัตราที่ตรวจสอบแล้วสำหรับเดือนนี้ รองรับ ก.ย. 2568–ธ.ค. 2569
                      โปรดใช้วิธีเฉลี่ยจากยอดในบิลจริง หรืออัปเดตประกาศ MEA ก่อนคำนวณแบบขั้นบันได
                    </Alert>
                  )}
                  {customRates && (
                    <Button className='action-buttons' variant='subtle' size='xs'
                      onClick={() => form.setValues({ ftOverride: null, serviceOverride: null })}>
                      คืนค่าตามประกาศ MEA
                    </Button>
                  )}
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    classNames={SelectClasses} label='หน่วยรวมทั้งบ้าน (kWh)' placeholder='ระบุ'
                    value={form.values.totalKwh ?? ""} min={0} allowNegative={false}
                    thousandSeparator decimalScale={2}
                    onChange={value => form.setFieldValue("totalKwh", numberOrNull(value))}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <NumberInput
                    classNames={SelectClasses} label='ส่วนลดหลัง VAT (บาท)' placeholder='0.00'
                    description='กรอกยอดส่วนลดสุทธิจากบิล ถ้ามี'
                    value={form.values.discount ?? ""} min={0} allowNegative={false}
                    thousandSeparator decimalScale={2} fixedDecimalScale
                    onChange={value => form.setFieldValue("discount", numberOrNull(value))}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <NumberInput
                    classNames={SelectClasses} label='หน่วยไฟของเครื่องใช้ไฟฟ้า (kWh)'
                    placeholder='เช่น เครื่องปรับอากาศ — เว้นว่างหากหารทั้งบิลเท่ากัน'
                    value={form.values.acKwh ?? ""} min={0} allowNegative={false}
                    thousandSeparator decimalScale={2}
                    onChange={value => form.setFieldValue("acKwh", numberOrNull(value))}
                    error={form.values.acKwh !== null && form.values.totalKwh !== null && form.values.acKwh > form.values.totalKwh
                      ? "หน่วยเครื่องใช้ไฟฟ้าต้องไม่เกินหน่วยรวมทั้งบ้าน" : undefined}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>

          <Tabs value={method} onChange={setMethod}>
            <Tabs.List grow>
              <Tabs.Tab value='marginal' leftSection={<IconSquareRoot2 size={20} />}>คำนวณวิธีละเอียด</Tabs.Tab>
              <Tabs.Tab value='proRata' leftSection={<IconCalculator size={20} />}>คำนวณประมาณแบบเฉลี่ย</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value='marginal' pt='md'>
              <Paper p='md' radius='sm' withBorder>
                <Stack>
                  <Text size='sm'>ขั้นบันได + Ft + ค่าบริการ + VAT</Text>
                  <Group gap='sm'>
                    <Button variant={form.values.allocateServiceProportionally ? "filled" : "light"}
                      onClick={() => form.setFieldValue("allocateServiceProportionally", true)}>
                      จัดสรรค่าบริการตามสัดส่วน
                    </Button>
                    <Button variant={!form.values.allocateServiceProportionally ? "filled" : "light"}
                      onClick={() => form.setFieldValue("allocateServiceProportionally", false)}>
                      ไม่จัดสรรค่าบริการ
                    </Button>
                  </Group>
                  {bill && marginal !== null ? (
                    <AmountTable rows={[
                      { label: "ค่าไฟส่วนของเครื่องใช้ไฟฟ้า", amount: marginal },
                      { label: "ค่าไฟส่วนที่เหลือสำหรับหารร่วมกัน", amount: round2(bill.total - marginal) },
                      { label: "รวมทั้งสิ้น", amount: bill.total, total: true },
                    ]} />
                  ) : <Alert color='orange' icon={<IconAlertCircle />}>กรุณากรอกหน่วยรวมให้มากกว่า 0 และตรวจสอบหน่วยเครื่องใช้ไฟฟ้า</Alert>}
                  <Text size='xs' c='dimmed'>
                    ค่าเครื่องใช้ไฟฟ้าคิดจากส่วนต่างของบิลเมื่อมีและไม่มีหน่วยของเครื่องนั้น โดยคงประเภทอัตราเดิม
                    ส่วนลดหลัง VAT กระจายตามสัดส่วนค่าใช้จ่าย วิธีหารภายในบ้านนี้ไม่ใช่กฎการเรียกเก็บรายคนของ MEA
                  </Text>
                </Stack>
              </Paper>
            </Tabs.Panel>
            <Tabs.Panel value='proRata' pt='md'>
              <Paper p='md' radius='sm' withBorder>
                <Stack>
                  <NumberInput
                    label='ยอดรวมก่อน VAT จากบิลจริง (บาท)' description='รวมค่าพลังงาน Ft และค่าบริการแล้ว'
                    value={form.values.preVatAmount ?? ""} min={0} allowNegative={false}
                    thousandSeparator decimalScale={2} fixedDecimalScale
                    onChange={value => form.setFieldValue("preVatAmount", numberOrNull(value))}
                  />
                  <Blockquote fz={14} cite='สูตรการคำนวณ'>
                    ค่าเครื่องใช้ไฟฟ้า = (ยอดสุทธิหลัง VAT และส่วนลด ÷ หน่วยรวม) × หน่วยเครื่องใช้ไฟฟ้า
                  </Blockquote>
                  {proRata ? (
                    <AmountTable rows={[
                      { label: "เฉลี่ยบาท/หน่วย (ก่อน VAT)", amount: proRata.avgBahtPerKWh },
                      { label: "ค่าเครื่องใช้ไฟฟ้าก่อน VAT และส่วนลด", amount: proRata.acPreVat },
                      { label: "ค่าเครื่องใช้ไฟฟ้าสุทธิ", amount: proRata.acTotal, total: true },
                    ]} />
                  ) : <Text size='sm' c='dimmed'>กรอกยอดก่อน VAT และหน่วยรวมจากบิลจริง</Text>}
                </Stack>
              </Paper>
            </Tabs.Panel>
          </Tabs>

          <Paper p='md' radius='sm' withBorder>
            <Stack>
              <Title order={6}>สรุปบิลค่าไฟฟ้า · {method === "proRata" ? "เฉลี่ยจากบิลจริง" : "ขั้นบันได MEA"}</Title>
              {canCalculate && activeBill ? (
                <AmountTable rows={[
                  ...(method === "marginal" && bill && tariff ? [
                    { label: "ค่าพลังงานไฟฟ้า", amount: bill.energy },
                    { label: "ค่าบริการรายเดือน", amount: bill.service },
                    { label: `ค่า Ft (${tariff.ftPerKWh.toFixed(4)} บาท/หน่วย)`, amount: bill.ft },
                  ] : []),
                  { label: "รวมก่อน VAT", amount: activeBill.preVat },
                  { label: "ภาษีมูลค่าเพิ่ม (VAT) 7%", amount: activeBill.vat },
                  { label: "รวมหลัง VAT", amount: activeBill.afterVat },
                  { label: "ส่วนลดหลัง VAT ที่ใช้", amount: -activeBill.discount },
                  { label: "ยอดรวมสุทธิ", amount: activeBill.total, total: true },
                ]} />
              ) : <Text size='sm' c='dimmed'>กรอกข้อมูลให้ครบเพื่อดูยอดรวม</Text>}
            </Stack>
          </Paper>

          <Accordion variant='contained'>
            <Accordion.Item value='tariff-rates'>
              <Accordion.Control><Title order={6}>อัตราค่าไฟฟ้าและเงื่อนไข MEA</Title></Accordion.Control>
              <Accordion.Panel>
                <Stack gap='sm'>
                  {tariff && (
                    <>
                      <Text size='sm'>
                        อัตรา{month >= "2026-09" ? "ตั้งแต่บิลกันยายน 2569" : "ก่อนบิลกันยายน 2569"}
                        {customRates ? " · มีการแก้ไขค่า Ft หรือค่าบริการเอง" : ""}
                      </Text>
                      <Table withTableBorder withColumnBorders striped>
                        <Table.Thead><Table.Tr><Table.Th>หน่วยที่ใช้</Table.Th><Table.Th ta='right'>บาท/หน่วย</Table.Th></Table.Tr></Table.Thead>
                        <Table.Tbody>
                          {tariff.steps.map((step, index) => {
                            const previous = index === 0 ? 0 : tariff.steps[index - 1].upto ?? 0
                            return (
                              <Table.Tr key={index}>
                                <Table.Td>{previous === 0 ? "หน่วยแรก" : `เกิน ${previous}`} {step.upto === null ? "ขึ้นไป" : `ถึง ${step.upto} หน่วย`}</Table.Td>
                                <Table.Td ta='right'>{step.rate.toFixed(4)}</Table.Td>
                              </Table.Tr>
                            )
                          })}
                        </Table.Tbody>
                      </Table>
                      <Text size='sm'>ค่าพลังงาน + ค่าบริการ + (หน่วยรวม × Ft) = ยอดก่อน VAT จากนั้นบวก VAT 7%</Text>
                    </>
                  )}
                  <Text size='xs' c='dimmed'>
                    สิทธิ์ค่าไฟฟรีของประเภท 1.1 และส่วนลดบัตรสวัสดิการมีเงื่อนไขด้านคุณสมบัติ/ประวัติการใช้ไฟ
                    ระบบไม่หักสิทธิ์ให้อัตโนมัติ หากบิลได้รับความช่วยเหลือแล้วให้ใช้วิธีเฉลี่ยจากยอดจริง
                  </Text>
                  <Group gap='sm'>
                    <Anchor href={TARIFF_SOURCES.rates} target='_blank' rel='noreferrer' size='sm'>อัตราบ้านอยู่อาศัย MEA</Anchor>
                    <Anchor href={TARIFF_SOURCES.ft} target='_blank' rel='noreferrer' size='sm'>ประกาศค่า Ft MEA</Anchor>
                  </Group>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          <Paper p='md' radius='sm' withBorder>
            <Stack>
              <Title order={6}>หารค่าไฟฟ้ากับเพื่อน</Title>
              <MultiSelect
                classNames={SelectClasses} data={friends} label='ผู้ใช้งานเครื่องใช้ไฟฟ้า' placeholder='เลือก'
                description='คนที่เลือกจะถูกเพิ่มในรายชื่อผู้หารบิลด้วย'
                clearable searchable nothingFoundMessage='ไม่พบตัวเลือก'
                value={form.values.appliances_user}
                onChange={value => form.setValues({
                  appliances_user: value, friends: [...new Set([...form.values.friends, ...value])],
                })}
              />
              <Stack gap={4}>
                <Group align='end' gap={6}>
                  <InputLabel htmlFor='bill-friends' fz={12} fw={400}>ผู้ใช้งานไฟฟ้าที่หารบิล</InputLabel>
                  <Tooltip label='เพิ่มตัวเลือก' withArrow>
                    <ActionIcon radius={50} size={20} onClick={open} aria-label='เพิ่มผู้ใช้งานไฟฟ้า'><IconPlus /></ActionIcon>
                  </Tooltip>
                </Group>
                <MultiSelect
                  id='bill-friends' classNames={SelectClasses} data={friends} placeholder='เลือก'
                  clearable searchable nothingFoundMessage='ไม่พบตัวเลือก' value={form.values.friends}
                  onChange={value => form.setValues({
                    friends: value,
                    appliances_user: form.values.appliances_user.filter(person => value.includes(person)),
                  })}
                />
              </Stack>
              <Text size='xs' c='dimmed'>
                ถ้าไม่เลือกผู้ใช้เครื่องใช้ไฟฟ้า จะหารยอดสุทธิเท่ากันทุกคน
                เศษสตางค์จัดสรรตามลำดับรายชื่อ เพื่อให้ยอดรวมตรงกับบิล
              </Text>
              <Title order={6}>คำนวณค่าไฟฟ้าต่อคน</Title>
              {shares.length > 0 && activeBill ? (
                <AmountTable rows={[
                  ...shares.map(share => ({ label: share.name, amount: share.total })),
                  { label: "รวมทั้งสิ้น", amount: activeBill.total, total: true },
                ]} />
              ) : <Text size='sm' c='dimmed'>กรอกข้อมูลค่าไฟและเลือกคนหารบิล</Text>}
            </Stack>
          </Paper>
          <Group className='action-buttons' justify='flex-end'>
            <Button onClick={saveBillAsJpeg} loading={isSaving} disabled={isSaving || !canCalculate}>
              {isSaving ? "กำลังสร้างบิล..." : "ดาวน์โหลดบิล"}
            </Button>
          </Group>
        </Stack>
      </Paper>
      <Modal title={<Title order={6}>เพิ่มตัวเลือกผู้ใช้งานไฟฟ้า</Title>} opened={opened} onClose={close} centered>
        <Stack>
          <TextInput label='ชื่อเล่น' placeholder='ระบุชื่อเล่น' {...addFriendForm.getInputProps("name")}
            onKeyDown={event => { if (event.key === "Enter") addFriend() }} />
          <Group justify='flex-end'>
            <Button variant='outline' onClick={close}>ยกเลิก</Button>
            <Button onClick={addFriend}>เพิ่ม</Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
