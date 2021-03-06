import { useForm } from "react-hook-form";
import { entries, fromEntries, mapObject, round } from "../utils/utils";
import {
  GUSCategories,
  calculateTotalInflationForWeights,
  defaultWeights_01_2022,
  WeightsRecord,
  gusCategoriesDetails,
} from "../utils/questions";
import {
  formatMoney,
  formatInflation,
  getInflationColor,
} from "../utils/format";
import { PLNInput } from "../components/PLNInput";
import { IncomeInput } from "../components/IncomeInput";
import { useEffect } from "react";
import { getFromStorage, saveToStorage } from "../utils/persistence";

const calculateTotalExpenses = (expenses: WeightsRecord) => {
  const expensesEntries = entries(expenses);
  return expensesEntries.reduce((acc, [, value]) => acc + value, 0);
};

const calculateTotalInflationForExpenses = (expenses: WeightsRecord) => {
  const expensesEntries = entries(expenses);
  const totalExpenses = calculateTotalExpenses(expenses);
  const weights: WeightsRecord = fromEntries(
    expensesEntries.map(
      ([key, value]) => [key, (100 * value) / totalExpenses] as const
    )
  );
  return calculateTotalInflationForWeights(weights);
};

const Home = () => {
  const { register, watch, reset } = useForm<WeightsRecord>();
  const values = watch();

  useEffect(() => {
    const formData = getFromStorage();
    if (formData) {
      reset(formData);
    } else {
      reset(
        mapObject(defaultWeights_01_2022, (_key, value) => round(value * 30, 2))
      );
    }
  }, [reset]);

  useEffect(() => {
    if (entries(values).length > 0) {
      saveToStorage(values);
    }
  }, [values]);

  const localInflation = calculateTotalInflationForExpenses(values);

  return (
    <div className="mt-6 relative max-w-lg mx-auto pb-48 px-4">
      <form className="grid grid-cols-1 prose prose-xl prose-h1:m-0 prose-h2:m-0 prose-h3:m-0 prose-h1:my-4 prose-h2:my-4 prose-p:mt-0 prose-p:mb-4 prose-h2:text-3xl prose-p:text-base">
        <h1>Kalkulator inflacji</h1>
        <p>
          Na podstawie cen towarów i usług konsumpcyjnych podanych przez
          stat.gov.pl w marcu 2022 r.
        </p>
        <p>
          <a
            className="text-green-600"
            href="https://github.com/typeofweb/kalkulator-inflacji"
          >
            Edytuj na GitHubie!
          </a>
        </p>
        <h2>Twoje miesięczne wydatki na:</h2>
        <div className="grid grid-cols-1 gap-12">
          {entries(GUSCategories).map(([key, title]) => (
            <label key={key} className="block text-gray-700">
              <h3 className="mb-2">{title}</h3>
              {gusCategoriesDetails[key].length > 0 ? (
                <div className="text-sm mb-4 mt-2">
                  W tym:
                  <ul className="text-xs text-gray-600 columns-2 mt-1">
                    {gusCategoriesDetails[key].map((text) => (
                      <li
                        key={text}
                        className="list-item list-disc ml-3 my-0 leading-relaxed"
                      >
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <PLNInput {...register(key, { valueAsNumber: true })} />
            </label>
          ))}
        </div>
      </form>
      <output
        className="lg:fixed mx-auto mt-16 lg:mt-0 rounded-lg border-2 border-green-500 px-4 py-3 shadow-green-100 shadow-lg position-near-center w-full lg:w-60 tabular-nums text-center prose prose-lg prose-p:m-0 prose-p:leading-tight grid grid-cols-1 gap-3"
        aria-live="polite"
      >
        <p className="text-lg">
          Twoje wydatki:
          <span className="block">
            {formatMoney(calculateTotalExpenses(watch()))}
          </span>
        </p>
        <p className="text-lg">
          Twoja inflacja r/r:{" "}
          <strong
            className={`font-bold inline-block text-2xl translate-y-0.5 ${getInflationColor(
              localInflation
            )}`}
          >
            {formatInflation(localInflation)}
          </strong>
        </p>
        <IncomeInput inflation={localInflation} />
      </output>
    </div>
  );
};

export default Home;
