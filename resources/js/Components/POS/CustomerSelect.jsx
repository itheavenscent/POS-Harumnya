import React, { useState, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import {
    IconUser,
    IconSearch,
    IconCheck,
    IconChevronDown,
    IconUserPlus,
    IconLoader2,
    IconPhone,
    IconId,
    IconStar,
} from "@tabler/icons-react";
import { CustomerHistoryButton } from "./CustomerHistoryPanel";
import AddCustomerModal from "./AddCustomerModal";

export default function CustomerSelect({
    customers = [],
    selected,
    onSelect,
    placeholder = "Pilih pelanggan...",
    error,
    label,
    onCustomerAdded,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [results, setResults] = useState(null); // null = pakai daftar preload
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Server-side search: cari ke SELURUH pelanggan (bukan cuma daftar preload).
    // Debounce 300ms + batalkan request lama agar hasil akurat & tak balapan.
    useEffect(() => {
        const term = search.trim();

        if (!term) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const controller = new AbortController();
        const timer = setTimeout(() => {
            axios
                .get(route("transactions.search-customers"), {
                    params: { q: term },
                    signal: controller.signal,
                })
                .then((res) => {
                    setResults(res.data?.data ?? []);
                    setLoading(false);
                })
                .catch((err) => {
                    if (!axios.isCancel(err) && err.code !== "ERR_CANCELED") {
                        console.error("Search customer error:", err);
                        setResults([]);
                        setLoading(false);
                    }
                });
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search]);

    // Daftar yang ditampilkan: hasil pencarian server bila ada query,
    // selain itu daftar preload dari props.
    const displayedCustomers = search.trim() ? results ?? [] : customers;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (customer) => {
        onSelect(customer);
        setIsOpen(false);
        setSearch("");
        setResults(null);
    };

    const formatRupiah = (n) =>
        "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));

    const handleAddCustomerSuccess = (newCustomer) => {
        setShowAddModal(false);
        // Reload page data to get updated customer list
        router.reload({ only: ["customers"] });
        onCustomerAdded?.(newCustomer);
    };

    return (
        <>
            <div ref={containerRef} className="relative">
                {/* Label */}
                {label && (
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        {label}
                    </label>
                )}

                {/* Select Button with History and Add */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`
                            flex-1 h-12 px-4 rounded-xl text-left
                            flex items-center gap-3
                            border-2 transition-all duration-200
                            ${
                                isOpen
                                    ? "border-primary-500 ring-4 ring-primary-500/20"
                                    : error
                                    ? "border-danger-500"
                                    : "border-slate-200 dark:border-slate-700"
                            }
                            bg-white dark:bg-slate-900
                        `}
                    >
                        <div
                            className={`
                            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                            ${
                                selected
                                    ? "bg-primary-100 dark:bg-primary-900/50"
                                    : "bg-slate-100 dark:bg-slate-800"
                            }
                        `}
                        >
                            <IconUser
                                size={18}
                                className={
                                    selected
                                        ? "text-primary-600 dark:text-primary-400"
                                        : "text-slate-400"
                                }
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            {selected ? (
                                <>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                        {selected.name}
                                    </p>
                                    {selected.phone && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {selected.phone}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500">
                                    {placeholder}
                                </p>
                            )}
                        </div>
                        <IconChevronDown
                            size={18}
                            className={`text-slate-400 transition-transform ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {/* History Button - Show when customer is selected */}
                    {selected && (
                        <CustomerHistoryButton
                            customerId={selected.id}
                            customerName={selected.name}
                        />
                    )}

                    {/* Add Customer Button */}
                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="h-12 w-12 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700
                            text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30
                            flex items-center justify-center transition-colors"
                        title="Tambah pelanggan baru"
                    >
                        <IconUserPlus size={20} />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <p className="mt-1 text-xs text-danger-500">{error}</p>
                )}

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-50 animate-slide-up overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <IconSearch
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama / no. telepon / kode..."
                                    className="w-full h-10 pl-10 pr-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                />
                                {loading && (
                                    <IconLoader2
                                        size={18}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 animate-spin"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Customer List */}
                        <div className="max-h-72 overflow-y-auto scrollbar-thin">
                            {displayedCustomers.length > 0 ? (
                                <ul>
                                    {displayedCustomers.map((customer) => {
                                        const isSelected =
                                            selected?.id === customer.id;
                                        return (
                                            <li key={customer.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelect(customer)
                                                    }
                                                    className={`
                                                    w-full flex items-start gap-3 px-4 py-3 text-left
                                                    transition-colors
                                                    ${
                                                        isSelected
                                                            ? "bg-primary-50 dark:bg-primary-950/30"
                                                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    }
                                                `}
                                                >
                                                    <div
                                                        className={`
                                                    w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                                                    ${
                                                        isSelected
                                                            ? "bg-primary-500 text-white"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                    }
                                                `}
                                                    >
                                                        {isSelected ? (
                                                            <IconCheck
                                                                size={16}
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-medium">
                                                                {customer.name
                                                                    ?.charAt(0)
                                                                    .toUpperCase() ||
                                                                    "?"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                                {customer.name}
                                                            </p>
                                                            {customer.tier && (
                                                                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex-shrink-0">
                                                                    {
                                                                        customer.tier
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                            {customer.phone && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <IconPhone
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                    {
                                                                        customer.phone
                                                                    }
                                                                </span>
                                                            )}
                                                            {customer.code && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <IconId
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                    {
                                                                        customer.code
                                                                    }
                                                                </span>
                                                            )}
                                                            {customer.points !=
                                                                null && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <IconStar
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                    {
                                                                        customer.points
                                                                    }{" "}
                                                                    poin
                                                                </span>
                                                            )}
                                                        </div>
                                                        {(customer.total_transactions !=
                                                            null ||
                                                            customer.lifetime_spending !=
                                                                null) && (
                                                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                                {customer.total_transactions !=
                                                                    null &&
                                                                    `${customer.total_transactions} transaksi`}
                                                                {customer.total_transactions !=
                                                                    null &&
                                                                    customer.lifetime_spending !=
                                                                        null &&
                                                                    " · "}
                                                                {customer.lifetime_spending !=
                                                                    null &&
                                                                    `Total ${formatRupiah(
                                                                        customer.lifetime_spending
                                                                    )}`}
                                                            </p>
                                                        )}
                                                        {customer.email && (
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                                {customer.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : loading ? (
                                <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                                    <IconLoader2
                                        size={24}
                                        className="mx-auto mb-2 animate-spin text-primary-500"
                                    />
                                    <p className="text-sm">Mencari...</p>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                                    <IconUser
                                        size={24}
                                        className="mx-auto mb-2 opacity-50"
                                    />
                                    <p className="text-sm">
                                        {search.trim()
                                            ? `Pelanggan "${search.trim()}" tidak ditemukan`
                                            : "Belum ada pelanggan"}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false);
                                            setShowAddModal(true);
                                        }}
                                        className="mt-2 text-sm text-primary-500 hover:text-primary-600 font-medium"
                                    >
                                        + Tambah pelanggan baru
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            <AddCustomerModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleAddCustomerSuccess}
            />
        </>
    );
}
