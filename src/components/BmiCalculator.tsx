import React, { useEffect, useState } from "react";
import './BmiCalculator.css';

// Helper class from the original code
class Utils {
	static LOCALE = "en-US";
	/**
	 * Get the BMI for metric units.
	 * @param height height in centimeters (cm)
	 * @param weight weight in kilograms (kg)
	 */
	static calcBMIInKg(weight: number, height: number): number {
        if (height === 0) return 0;
		return weight / ((height/100) ** 2);
	}
	/**
	 * Get the BMI for US units.
	 * @param height height in inches (in)
	 * @param weight weight in pounds (lbs)
	 */
	static calcBMIInLbs(height: number, weight: number): number {
        if (height === 0) return 0;
		return (weight * 703) / (height ** 2);
	}
	/**
	 * Format any kind of number to a localized format.
	 * @param n number
	 * @param decimalPlaces max number of decimal places
	 */
	static formatNumber(n: number, decimalPlaces: number = 1) {
		return new Intl.NumberFormat(this.LOCALE, {
			maximumFractionDigits: decimalPlaces
		}).format(n);
	}
}


type System = "us" | "metric";

const BmiCalculator: React.FC = () => {
    const [system, setSystem] = useState<System>('metric');
    const [height, setHeight] = useState<number>(170); // cm
    const [weight, setWeight] = useState<number>(65); // kg
    const [bmi, setBmi] = useState<number>(0);

    const calcBMI = (h: number, w: number, sys: System): number => {
        if (sys === 'metric') {
            return Utils.calcBMIInKg(w, h);
        } else {
            return Utils.calcBMIInLbs(h, w);
        }
    };
    
    useEffect(() => {
        const result = calcBMI(height, weight, system);
        setBmi(result);
    }, [height, weight, system]);

    const handleSystemChange = (sys: System) => {
        setSystem(sys);
        if (sys === 'metric') {
            // convert freedom units to metric
            setHeight(prev => Math.round(prev * 2.54));
            setWeight(prev => Math.round(prev / 2.205));
        } else {
            // convert metric to freedom units
            setHeight(prev => Math.round(prev / 2.54));
            setWeight(prev => Math.round(prev * 2.205));
        }
    }

    const getBmiCategory = (bmiValue: number) => {
        if (bmiValue <= 0) return "";
        if (bmiValue < 18.5) return "Thiếu cân";
        if (bmiValue < 24.9) return "Bình thường";
        if (bmiValue < 29.9) return "Thừa cân";
        return "Béo phì";
    }

    const category = getBmiCategory(bmi);

    return (
    <div className="bmi-container">
        <div className="bmi-toggle">
            <button 
                onClick={() => handleSystemChange('metric')}
                className={`metric ${system === 'metric' ? 'active' : ''}`}
            >
                Hệ mét (cm, kg)
            </button>
            <button 
                onClick={() => handleSystemChange('us')}
                className={`us ${system === 'us' ? 'active' : ''}`}
            >
                Hệ đo lường Mỹ (in, lbs)
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bmi-input">
                <label htmlFor="height">Chiều cao ({system === 'metric' ? 'cm' : 'in'})</label>
                <input 
                    type="number" 
                    id="height"
                    value={height}
                    onChange={e => setHeight(Number(e.target.value))}
                />
            </div>
            <div className="bmi-input">
                <label htmlFor="weight">Cân nặng ({system === 'metric' ? 'kg' : 'lbs'})</label>
                <input 
                    type="number" 
                    id="weight"
                    value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                />
            </div>
        </div>

        {bmi > 0 && (
            <div className="bmi-result">
                <h3>Chỉ số BMI của bạn</h3>
                <p className="bmi-value">{Utils.formatNumber(bmi)}</p>
                <p className={`bmi-category 
                    ${category === 'Thiếu cân' ? 'thieu-can' : ''} 
                    ${category === 'Bình thường' ? 'binh-thuong' : ''} 
                    ${category === 'Thừa cân' ? 'thua-can' : ''} 
                    ${category === 'Béo phì' ? 'beo-phi' : ''}`}>
                    {category}
                </p>
            </div>
        )}
    </div>
    );

};

export default BmiCalculator;
