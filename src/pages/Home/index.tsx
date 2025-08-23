import { NumberFormatUtil } from "@/utils/NumberFormatUtil"
import { NumberInputUtil } from "@/utils/NumberInputUtil"
import {
  Accordion,
  ActionIcon,
  Alert,
  Blockquote,
  Button,
  Container,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core"
import { MonthPickerInput, type DateValue } from "@mantine/dates"
import { useForm } from "@mantine/form"
import {
  IconAlertCircle,
  IconCalculator,
  IconPlus,
  IconSquareRoot2,
} from "@tabler/icons-react"
import { toBlob } from "html-to-image"
import { useMemo, useState, type FC } from "react"

import { colors } from "@/const/theme/colors"
import { useDisclosure } from "@mantine/hooks"
import dayjs from "dayjs"
import SelectClasses from "./cssModules/Select.module.css"

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

type BillSummary = {
  totalKwh: number // kWh ทั้งบ้านจากบิล
  preVatAmount: number // ยอดรวมก่อน VAT จากบิล
  vatRate?: number // 0.07 by default
}

type TariffStep = { upto: number | null; rate: number } // บาท/หน่วย (เฉพาะ energy)

type Tariff = {
  steps: TariffStep[] // เรียงจากต่ำ -> สูง
  ftPerKWh: number // Ft บาท/หน่วย ของรอบบิล
  serviceCharge: number // ค่าบริการรายเดือน (บาท)
  vatRate?: number // 0.07 by default
}

// ---------------- Hidden Tariff Profile ----------------
// แก้ประกาศที่นี่เท่านั้น ไม่แสดงบน UI
// ตัวเลขตัวอย่างอิงจากเอกสาร MEA/PEA (ดูใบประกาศ) และบิลตัวอย่าง: Ft=0.1972, Service=24.62, VAT=7%
// หมายเหตุ: ช่วงบล็อกอัตราที่อยู่อาศัยจะเปลี่ยนขึ้นกับเงื่อนไข 1.1/1.2 ของการไฟฟ้า โปรไฟล์นี้ตั้งให้ครอบคลุมกรณีใช้เกิน 150 หน่วย/เดือน
const TARIFF_MEA_RESIDENTIAL_2568_DEFAULT: Tariff = {
  steps: [
    // สำหรับผู้ใช้เกิน 150 หน่วย/เดือน (อัตรา 1.2)
    { upto: 150, rate: 3.2484 },
    { upto: 400, rate: 4.2218 },
    { upto: null, rate: 4.4217 },
  ],
  ftPerKWh: 0.1972,
  serviceCharge: 24.62,
  vatRate: 0.07,
}

function energyChargeBySteps(kwh: number, steps: TariffStep[]) {
  let remain = kwh,
    prevCap = 0,
    total = 0
  for (const s of steps) {
    const cap = s.upto ?? Number.POSITIVE_INFINITY
    const qty = Math.max(0, Math.min(remain, cap - prevCap))
    total += qty * s.rate
    remain -= qty
    prevCap = cap
    if (remain <= 0) break
  }
  return total
}

function calcBillFromUsage(kwh: number, t: Tariff) {
  const vatRate = t.vatRate ?? 0.07
  const energy = energyChargeBySteps(kwh, t.steps)
  const ft = t.ftPerKWh * kwh
  const preVat = energy + ft + t.serviceCharge
  const vat = preVat * vatRate
  const total = preVat + vat
  return {
    kwh,
    energy: round2(energy),
    ft: round2(ft),
    service: round2(t.serviceCharge),
    preVat: round2(preVat),
    vat: round2(vat),
    total: round2(total),
  }
}

// วิธีง่าย (เฉลี่ยบาท/หน่วยจากบิลจริง)
function estimateAcCostProRata(bill: BillSummary, acKwh: number) {
  const { totalKwh, preVatAmount, vatRate = 0.07 } = bill
  if (totalKwh <= 0) throw new Error("totalKwh ต้องมากกว่า 0")
  if (acKwh < 0 || acKwh > totalKwh)
    throw new Error("acKwh ต้องอยู่ระหว่าง 0..totalKwh")
  const avgBahtPerKWh = preVatAmount / totalKwh // ก่อน VAT
  const acPreVat = acKwh * avgBahtPerKWh
  const acTotal = acPreVat * (1 + vatRate)
  return {
    avgBahtPerKWh: round2(avgBahtPerKWh),
    acPreVat: round2(acPreVat),
    acTotal: round2(acTotal),
  }
}

// วิธีละเอียด (บิลจริง) — ส่วนต่างของบิลเมื่อมี/ไม่มี kWh ของเครื่องใช้ไฟฟ้า
function estimateAcCostMarginal(
  totalKwh: number,
  acKwh: number,
  t: Tariff,
  allocateServiceProportionally = true
) {
  if (acKwh < 0 || acKwh > totalKwh)
    throw new Error("acKwh ต้องอยู่ระหว่าง 0..totalKwh")
  const withAc = calcBillFromUsage(totalKwh, t).total
  const withoutAc = calcBillFromUsage(totalKwh - acKwh, t).total
  const vatRate = t.vatRate ?? 0.07
  let acCost = withAc - withoutAc // รวม VAT แล้ว
  if (allocateServiceProportionally && totalKwh > 0) {
    // จัดสรรค่าบริการตามสัดส่วนการใช้ไฟของเครื่องใช้ไฟฟ้า
    // ตัวอย่าง: ค่าบริการ 38.22 บาท, VAT 7%, เครื่องใช้ไฟฟ้า 100 kWh จาก 500 kWh รวม
    // = 38.22 × 1.07 × (100/500) = 8.18 บาท
    acCost += t.serviceCharge * (1 + vatRate) * (acKwh / totalKwh)
  }
  return round2(acCost)
}

type FormValues = {
  billDate: DateValue
  totalKwh: number
  preVatAmount: number // ใช้ในแท็บ pro‑rata เท่านั้น
  vatRate: number
  discount: number
  acKwh: number
  allocateServiceProportionally: boolean
  appliances_user: string | null
  friends: string[]
}

export const HomePage: FC = () => {
  const [opened, { open, close }] = useDisclosure(false)
  const [friends, setFriends] = useState<string[]>(["โอม", "เฟรชชี่"])
  const [isSaving, setIsSaving] = useState(false)

  const addFriendForm = useForm({
    initialValues: {
      name: "",
    },
  })

  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: {
      billDate: new Date(),
      totalKwh: 0,
      preVatAmount: 0,
      vatRate: 0.07,
      discount: 0,
      acKwh: 0,
      allocateServiceProportionally: true,
      appliances_user: "เฟรชชี่",
      friends: [],
    },
    validate: {
      totalKwh: v => (v <= 0 ? "ต้องมากกว่า 0" : null),
      acKwh: (v, values) =>
        v < 0 || v > values.totalKwh
          ? "ต้องอยู่ระหว่าง 0..หน่วยรวมทั้งบ้าน"
          : null,
      vatRate: v => (v < 0 || v > 1 ? "0..1" : null),
      preVatAmount: v => (v < 0 ? "ต้องไม่ติดลบ" : null),
    },
  })

  const tariff = TARIFF_MEA_RESIDENTIAL_2568_DEFAULT

  const proRata = useMemo(() => {
    try {
      const { totalKwh, preVatAmount, vatRate, acKwh } = form.values
      return estimateAcCostProRata({ totalKwh, preVatAmount, vatRate }, acKwh)
    } catch {
      return null
    }
  }, [form.values])

  const marginal = useMemo(() => {
    try {
      const { totalKwh, acKwh, allocateServiceProportionally } = form.values
      return estimateAcCostMarginal(
        totalKwh,
        acKwh,
        tariff,
        allocateServiceProportionally
      )
    } catch {
      return null
    }
  }, [form.values])

  const saveBillAsJpeg = async () => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const billContainer = document.getElementById("bill-container")
      if (!billContainer) {
        alert("ไม่พบส่วนประกอบบิล")
        return
      }

      // Wait for any async rendering to complete
      await new Promise(resolve => setTimeout(resolve, 300))

      const bill = billContainer.cloneNode(true) as HTMLElement
      bill.id = "bill-container-clone"
      bill.style.width = "600px"
      bill.style.height = "auto"
      bill.style.overflow = "hidden"
      bill.style.margin = "0 auto"
      bill.style.padding = "20px"
      bill.style.backgroundColor = "white"
      bill.style.position = "absolute"
      bill.style.left = "0"
      bill.style.top = "0"
      bill.style.zIndex = "-9999"

      document.body.appendChild(bill)

      const billClone = document.getElementById("bill-container-clone")
      if (!billClone) {
        alert("ไม่พบส่วนประกอบบิล")
        return
      }

      // Generate JPEG using html-to-image with high quality settings
      const blob = await toBlob(billClone, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "white",
        width: billClone.scrollWidth,
        height: billClone.scrollHeight - 50,
        cacheBust: true,
        includeQueryParams: false,
        imagePlaceholder: "",
        preferredFontFormat: "woff2",
        skipAutoScale: false,
        filter: node => {
          // Filter out any problematic nodes
          if (node.classList?.contains("action-buttons")) {
            return false
          }
          return true
        },
      })

      document.body.removeChild(billClone)
      if (!blob) {
        throw new Error("Failed to generate image")
      }

      // Create download link
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)

      // Generate filename with Thai month
      const billDate = form.values.billDate
      const dateString =
        billDate instanceof Date
          ? dayjs(billDate).format("MMMM_BBBB")
          : "ไม่ระบุเดือน"
      link.download = `บิลค่าไฟฟ้า_${dateString}.jpg`

      // Trigger download
      link.click()

      // Clean up the object URL
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error("Error saving bill:", error)
      alert("เกิดข้อผิดพลาดในการบันทึกบิล")
    } finally {
      setIsSaving(false)
    }
  }

  const header = (
    <>
      <Title order={5} mb='md'>
        ระบบคำนวณค่าไฟฟ้า กฟน.
      </Title>
      <Paper p='md' radius='sm' withBorder>
        <Stack gap='sm'>
          <Title order={6}>ข้อมูลการใช้ไฟฟ้า</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <MonthPickerInput
                classNames={SelectClasses}
                label='ประจำเดือน'
                {...form.getInputProps("billDate")}
                onChange={v => form.setFieldValue("billDate", v)}
                maxDate={new Date()}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                classNames={SelectClasses}
                label='ค่าบริการ'
                value={tariff.serviceCharge}
                thousandSeparator
                disabled
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                classNames={SelectClasses}
                label='ค่าไฟฟ้าผันแปร (Ft)'
                value={tariff.ftPerKWh}
                thousandSeparator
                disabled
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                classNames={SelectClasses}
                label='หน่วยรวมทั้งบ้าน (kWh)'
                {...form.getInputProps("totalKwh")}
                onChange={v => form.setFieldValue("totalKwh", Number(v) || 0)}
                min={0}
                thousandSeparator
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                classNames={SelectClasses}
                label='ส่วนลด'
                {...form.getInputProps("discount")}
                onChange={v => form.setFieldValue("discount", Number(v) || 0)}
                min={0}
                thousandSeparator
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                classNames={SelectClasses}
                label='VAT'
                value={NumberInputUtil.valueWithZero(form.values.vatRate * 100)}
                onBlur={NumberInputUtil.onBlurWithZero(form, "vatRate")}
                onChange={v =>
                  form.setFieldValue("vatRate", Number(v) / 100 || 0)
                }
                min={0}
                max={100}
                step={1}
                suffix='%'
                allowDecimal
                fixedDecimalScale
                decimalScale={2}
                allowNegative={false}
                disabled
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <NumberInput
                classNames={SelectClasses}
                label='หน่วยไฟของเครื่องใช้ไฟฟ้า (kWh)'
                {...form.getInputProps("acKwh")}
                onChange={v => form.setFieldValue("acKwh", Number(v) || 0)}
                min={0}
                thousandSeparator
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </>
  )

  const calculatorTabs = (
    <Tabs defaultValue='marginal'>
      <Tabs.List grow style={{ overflowX: "auto" }}>
        <Tabs.Tab value='marginal'>
          <Group gap='xs' wrap='nowrap'>
            <IconSquareRoot2 size={24} />
            <Text fz={14}>คำนวณวิธีละเอียด </Text>
            <Text fz={10} c='dimmed' component='span'>
              (ขั้นบันได + Ft + ค่าบริการ + VAT)
            </Text>
          </Group>
        </Tabs.Tab>
        <Tabs.Tab value='proRata'>
          <Group gap='xs'>
            <IconCalculator size={24} />
            <Text fz={14}>คำนวณประมาณแบบเฉลี่ย</Text>
          </Group>
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value='marginal' pt='md'>
        <Paper p='md' radius='sm' withBorder>
          <Stack>
            <Group gap='sm' mb='xs'>
              <Button
                variant={
                  form.values.allocateServiceProportionally ? "filled" : "light"
                }
                onClick={() =>
                  form.setFieldValue("allocateServiceProportionally", true)
                }
              >
                จัดสรรค่าบริการตามสัดส่วน
              </Button>
              <Button
                variant={
                  !form.values.allocateServiceProportionally
                    ? "filled"
                    : "light"
                }
                onClick={() =>
                  form.setFieldValue("allocateServiceProportionally", false)
                }
              >
                ไม่จัดสรรค่าบริการ
              </Button>
            </Group>

            <Blockquote
              fz={14}
              cite='สูตรการคำนวณ'
              style={{ whiteSpace: "pre-line" }}
            >
              {`ขั้นบันได + Ft + ค่าบริการ + VAT`}
            </Blockquote>
            {marginal !== null ? (
              <Table withTableBorder withColumnBorders striped>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>ค่าไฟส่วนของเครื่องใช้ไฟฟ้า</Table.Td>
                    <Table.Td align='right'>
                      {NumberFormatUtil.toBaht(marginal)}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>บิลรวมถ้าไม่มีหน่วยเครื่องใช้ไฟฟ้า</Table.Td>
                    <Table.Td align='right'>
                      {NumberFormatUtil.toBaht(
                        (() => {
                          const withoutAcBill = calcBillFromUsage(
                            form.values.totalKwh - form.values.acKwh,
                            TARIFF_MEA_RESIDENTIAL_2568_DEFAULT
                          ).total

                          if (
                            form.values.allocateServiceProportionally &&
                            form.values.totalKwh > 0
                          ) {
                            const vatRate =
                              TARIFF_MEA_RESIDENTIAL_2568_DEFAULT.vatRate ??
                              0.07
                            const serviceAllocation =
                              TARIFF_MEA_RESIDENTIAL_2568_DEFAULT.serviceCharge *
                              (1 + vatRate) *
                              (form.values.acKwh / form.values.totalKwh)
                            return withoutAcBill - serviceAllocation
                          }

                          return withoutAcBill
                        })()
                      )}
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>
                      <b>รวมทั้งสิ้น</b>
                    </Table.Td>
                    <Table.Td align='right'>
                      <b>
                        {NumberFormatUtil.toBaht(
                          calcBillFromUsage(
                            form.values.totalKwh,
                            TARIFF_MEA_RESIDENTIAL_2568_DEFAULT
                          ).total
                        )}
                      </b>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            ) : (
              <Alert color='red' icon={<IconAlertCircle />}>
                กรุณาตรวจสอบข้อมูลหน่วยรวม/หน่วยเครื่องใช้ไฟฟ้า
              </Alert>
            )}
          </Stack>
        </Paper>
      </Tabs.Panel>

      <Tabs.Panel value='proRata' pt='md'>
        <Paper p='md' radius='lg' withBorder>
          <Stack>
            <Group grow>
              <NumberInput
                label='ยอดรวมก่อน VAT (บาท)'
                {...form.getInputProps("preVatAmount")}
                onChange={v =>
                  form.setFieldValue("preVatAmount", Number(v) || 0)
                }
                min={0}
                thousandSeparator
                decimalScale={2}
                fixedDecimalScale
              />
            </Group>

            <Blockquote
              fz={14}
              cite='สูตรการคำนวณ'
              style={{ whiteSpace: "pre-line" }}
            >
              {`ค่าไฟเครื่องใช้ไฟฟ้า ≈ 
          (ยอดก่อน VAT ÷ หน่วยรวม) × หน่วยเครื่องใช้ไฟฟ้า × (1 + VAT)`}
            </Blockquote>

            {(() => {
              try {
                const r = proRata
                if (!r) return null
                return (
                  <Table withTableBorder withColumnBorders striped mt='sm'>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td>เฉลี่ยบาท/หน่วย (ก่อน VAT)</Table.Td>
                        <Table.Td align='right'>
                          {NumberFormatUtil.toCommaWithMinDecimal(
                            r.avgBahtPerKWh,
                            2,
                            2
                          )}
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>ค่าไฟเครื่องใช้ไฟฟ้าก่อน VAT</Table.Td>
                        <Table.Td align='right'>
                          {NumberFormatUtil.toBaht(r.acPreVat)}
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td>ค่าไฟเครื่องใช้ไฟฟ้าสุทธิ (รวม VAT)</Table.Td>
                        <Table.Td align='right'>
                          <b>{NumberFormatUtil.toBaht(r.acTotal)}</b>
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                )
              } catch {
                return (
                  <Alert color='red' icon={<IconAlertCircle />}>
                    กรอกข้อมูลให้ครบถ้วน
                  </Alert>
                )
              }
            })()}
          </Stack>
        </Paper>
      </Tabs.Panel>
    </Tabs>
  )

  const tariffInfo = (
    <Accordion variant='contained'>
      <Accordion.Item value='tariff-rates'>
        <Accordion.Control>
          <Title order={6}>อัตราค่าไฟฟ้าที่ใช้ในการคำนวณ</Title>
        </Accordion.Control>
        <Accordion.Panel>
          <Paper radius='md' withBorder style={{ overflow: "hidden" }}>
            <Table withColumnBorders striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>รายการ</Table.Th>
                  <Table.Th align='right'>อัตรา/ค่าใช้จ่าย</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>ขั้นที่ 1 (0-150 หน่วย)</Table.Td>
                  <Table.Td align='right'>
                    {NumberFormatUtil.toBahtPerUnit(tariff.steps[0].rate)}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>ขั้นที่ 2 (151-400 หน่วย)</Table.Td>
                  <Table.Td align='right'>
                    {NumberFormatUtil.toBahtPerUnit(tariff.steps[1].rate)}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>ขั้นที่ 3 (401 หน่วยขึ้นไป)</Table.Td>
                  <Table.Td align='right'>
                    {NumberFormatUtil.toBahtPerUnit(tariff.steps[2].rate)}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>ค่า Ft</Table.Td>
                  <Table.Td align='right'>
                    {NumberFormatUtil.toBahtPerUnit(tariff.ftPerKWh)}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>ค่าบริการรายเดือน</Table.Td>
                  <Table.Td align='right'>
                    {NumberFormatUtil.toBaht(tariff.serviceCharge)}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>VAT</Table.Td>
                  <Table.Td align='right'>
                    {NumberFormatUtil.toPercentage(tariff.vatRate ?? 0.07)}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )

  const friendsDivided = (
    <Paper p='md' radius='sm' withBorder>
      <Stack>
        <Title order={6}>หารค่าไฟฟ้ากับเพื่อน</Title>

        <Select
          classNames={SelectClasses}
          data={friends}
          label='ผู้ใช้งานเครื่องใช้ไฟฟ้า'
          placeholder='เลือก'
          clearable
          nothingFoundMessage='ไม่พบตัวเลือก'
          value={form.values.appliances_user}
          onChange={v => form.setFieldValue("appliances_user", v)}
        />
        <Group align='flex-end'>
          <MultiSelect
            flex={1}
            classNames={SelectClasses}
            data={friends}
            label='เพิ่มคนหารค่าไฟฟ้า'
            placeholder='เลือก'
            clearable
            nothingFoundMessage='ไม่พบตัวเลือก'
            searchable
            styles={{
              input: {
                minHeight: 40,
                height: "auto",
              },
              pill: {
                backgroundColor: colors.main[2],
                borderRadius: 4,
              },
            }}
            value={form.values.friends}
            onChange={v => form.setFieldValue("friends", v)}
          />
          <Tooltip label='เพิ่มตัวเลือก' withArrow>
            <ActionIcon size={40} onClick={open}>
              <IconPlus />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Title order={6}>คำนวณค่าไฟฟ้าต่อคน</Title>

        <Paper radius='sm' withBorder style={{ overflow: "hidden" }}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ชื่อผู้ใช้งาน</Table.Th>
                <Table.Th ta='right'>ค่าไฟฟ้า (บาท)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(() => {
                const selectedFriends = form.values.friends

                if (selectedFriends.length === 0) {
                  return (
                    <Table.Tr>
                      <Table.Td colSpan={2} ta='center' c='dimmed'>
                        <Text fz={12}>กรุณาเลือกคนหารค่าไฟฟ้า</Text>
                      </Table.Td>
                    </Table.Tr>
                  )
                }

                const acCost = marginal || 0
                const totalBill = calcBillFromUsage(
                  form.values.totalKwh,
                  TARIFF_MEA_RESIDENTIAL_2568_DEFAULT
                ).total
                const baseCost = totalBill - acCost
                const costPerPerson = baseCost / selectedFriends.length
                const appliancesUser = form.values.appliances_user

                return selectedFriends.map(friend => {
                  const isAppliancesUser = friend === appliancesUser
                  const friendCost =
                    costPerPerson + (isAppliancesUser ? acCost : 0)

                  return (
                    <Table.Tr key={friend}>
                      <Table.Td>{friend}</Table.Td>
                      <Table.Td ta='right'>
                        {NumberFormatUtil.toBaht(friendCost)}
                      </Table.Td>
                    </Table.Tr>
                  )
                })
              })()}
              <Table.Tr bg='var(--table-striped-color)'>
                <Table.Td>
                  <b>รวมทั้งสิ้น</b>
                </Table.Td>
                <Table.Td ta='right'>
                  <b>
                    {NumberFormatUtil.toBaht(
                      calcBillFromUsage(
                        form.values.totalKwh,
                        TARIFF_MEA_RESIDENTIAL_2568_DEFAULT
                      ).total
                    )}
                  </b>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </Paper>
  )

  return (
    <Container size='sm' h='100%'>
      <Paper id='bill-container' p='24px' radius='md' withBorder>
        <Stack>
          {header}
          {calculatorTabs}
          {tariffInfo}
          {friendsDivided}
          <Group className='action-buttons' justify='flex-end'>
            <Button
              onClick={saveBillAsJpeg}
              loading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? "กำลังสร้างบิล..." : "ดาวน์โหลดบิล"}
            </Button>
          </Group>
        </Stack>
      </Paper>
      {opened && (
        <Modal
          title={<Title order={6}>เพิ่มตัวเลือกคนหารค่าไฟฟ้า</Title>}
          opened={opened}
          onClose={close}
          centered
          withCloseButton={false}
        >
          <Stack>
            <TextInput
              label='ชื่อเล่น'
              {...addFriendForm.getInputProps("name")}
            />
            <Group justify='flex-end'>
              <Button variant='outline' onClick={close}>
                ยกเลิก
              </Button>
              <Button
                variant='filled'
                onClick={() => {
                  setFriends([...friends, addFriendForm.values.name])
                  close()
                }}
              >
                เพิ่ม
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}
    </Container>
  )
}
