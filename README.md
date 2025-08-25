# ⚡ Electricity Bill Calculation System

A modern web application for calculating electricity bills with advanced features including cost sharing, tariff calculations, and bill generation.

## 🌟 Features

### **Core Functionality**

- **Electricity Bill Calculator** - Calculate costs using MEA/PEA tariff structures
- **Two Calculation Methods**:
  - **Marginal Method** - Detailed calculation with step rates, Ft charges, and service fees
  - **Pro-rata Method** - Simple average cost per unit calculation
- **Cost Sharing System** - Split bills among roommates with appliance-specific allocations
- **Bill Generation** - Export calculations as high-quality JPEG images

### **Advanced Features**

- **Real-time Calculations** - Instant updates as you input data
- **Tariff Management** - Configurable electricity rates and service charges
- **VAT Handling** - Automatic VAT calculations (default 7%)
- **Responsive Design** - Mobile-optimized interface
- **Thai Language Support** - Full Thai language interface

### **Technical Features**

- **Modern React** - Built with React 18 and TypeScript
- **Mantine UI** - Beautiful, accessible component library
- **Custom Fonts** - IBM Plex Sans Thai font integration
- **Form Validation** - Comprehensive input validation
- **Error Handling** - User-friendly error messages

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+
- npm or yarn package manager

### **Installation**

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd electricity-bill-calculation-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### **Build for Production**

```bash
npm run build
```

## 🏗️ Project Structure

```
electricity-bill-calculation-system/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   │   └── Home/           # Main calculator page
│   ├── utils/              # Utility functions
│   │   ├── NumberFormatUtil.ts    # Number formatting utilities
│   │   └── NumberInputUtil.ts     # Input handling utilities
│   ├── const/              # Constants and configuration
│   │   └── theme/          # Theme configuration
│   ├── assets/             # Static assets
│   │   └── fonts/          # Custom fonts (IBM Plex Sans Thai)
│   └── router/             # Application routing
├── public/                 # Public assets
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 💡 Usage Guide

### **Basic Bill Calculation**

1. **Enter Monthly Data**

   - Select billing month
   - Input total household electricity usage (kWh)
   - Specify appliance electricity usage (kWh)

2. **Choose Calculation Method**

   - **Marginal Method**: For detailed, accurate calculations
   - **Pro-rata Method**: For quick estimates

3. **View Results**
   - See detailed breakdown of costs
   - View cost per person for sharing

### **Cost Sharing**

1. **Add Roommates**

   - Click the "+" button to add new people
   - Enter names for cost sharing

2. **Select Appliance User**

   - Choose who uses the specific appliance
   - System automatically calculates fair distribution

3. **View Individual Costs**
   - See each person's share of the bill
   - Includes appliance-specific costs

### **Export Bill**

1. **Generate Image**

   - Click "ดาวน์โหลดบิล" (Download Bill)
   - System captures all sections as JPEG

2. **Download**
   - Automatic download with Thai month naming
   - High-quality image suitable for printing/sharing

## ⚙️ Configuration

### **Tariff Settings**

The system uses MEA residential tariff structure (2568) by default:

```typescript
const TARIFF_MEA_RESIDENTIAL_2568_DEFAULT: Tariff = {
  steps: [
    { upto: 150, rate: 3.2484 }, // 0-150 units
    { upto: 400, rate: 4.2218 }, // 151-400 units
    { upto: null, rate: 4.4217 }, // 401+ units
  ],
  ftPerKWh: 0.1972, // Ft charge per unit
  serviceCharge: 24.62, // Monthly service fee
  vatRate: 0.07, // VAT rate (7%)
}
```

### **Customization**

- Modify tariff rates in `src/pages/Home/index.tsx`
- Adjust VAT rates and service charges
- Customize calculation methods

## 🎨 UI Components

### **Built with Mantine**

- **Container** - Responsive layout containers
- **Paper** - Card-like components with borders
- **Table** - Data display tables
- **Tabs** - Tabbed interface for different methods
- **NumberInput** - Numeric input with validation
- **Button** - Interactive buttons with loading states

### **Custom Styling**

- **IBM Plex Sans Thai** - Custom Thai font integration
- **Color Scheme** - Consistent color palette
- **Responsive Design** - Mobile-first approach

## 🔧 Technical Details

### **Dependencies**

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Mantine** - UI component library
- **html-to-image** - Image generation from DOM
- **dayjs** - Date manipulation
- **Vite** - Fast build tool

### **Key Functions**

- `energyChargeBySteps()` - Calculate energy costs by tariff steps
- `calcBillFromUsage()` - Generate complete bill from usage
- `estimateAcCostMarginal()` - Marginal cost calculation
- `estimateAcCostProRata()` - Pro-rata cost calculation
- `saveBillAsJpeg()` - Export bill as image

## 📱 Browser Support

- ✅ **Chrome** (latest) - Full support
- ✅ **Firefox** (latest) - Full support
- ✅ **Safari** (latest) - Full support
- ❌ **Internet Explorer** - Not supported

## 🚧 Development

### **Available Scripts**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Code Style**

- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript** - Type safety

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MEA/PEA** - For electricity tariff information
- **Mantine** - For the excellent UI component library
- **IBM Plex Sans Thai** - For beautiful Thai typography

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include browser version and error messages

---

**Made with ⚡ by trwfs00**
