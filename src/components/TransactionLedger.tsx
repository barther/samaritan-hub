import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Download, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  date: string;
  type: 'donation' | 'disbursement';
  amount: number;
  description: string;
  client_name?: string;
  balance: number;
}

interface TransactionLedgerProps {
  balance: number;
  onRefresh?: () => void;
}

export const TransactionLedger = ({ balance, onRefresh }: TransactionLedgerProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);

      // Load donations and disbursements
      const [donationsRes, disbursementsRes] = await Promise.all([
        supabase
          .from('donations')
          .select('id, amount, donation_date, donor_name, notes, source')
          .order('donation_date', { ascending: false }),
        supabase
          .from('disbursements')
          .select(`
            id, 
            amount, 
            disbursement_date, 
            recipient_name, 
            notes,
            assistance_type,
            clients(first_name, last_name)
          `)
          .order('disbursement_date', { ascending: false })
      ]);

      if (donationsRes.error) throw donationsRes.error;
      if (disbursementsRes.error) throw disbursementsRes.error;

      // Process donations
      const donationTransactions: Transaction[] = (donationsRes.data || []).map(donation => ({
        id: `donation-${donation.id}`,
        date: donation.donation_date,
        type: 'donation' as const,
        amount: donation.amount,
        description: donation.donor_name || 'Anonymous Donation',
        balance: 0 // Will be calculated below
      }));

      // Process disbursements
      const disbursementTransactions: Transaction[] = (disbursementsRes.data || []).map(disbursement => ({
        id: `disbursement-${disbursement.id}`,
        date: disbursement.disbursement_date,
        type: 'disbursement' as const,
        amount: disbursement.amount,
        description: disbursement.assistance_type?.replace('_', ' ') || 'Assistance',
        client_name: disbursement.clients 
          ? `${disbursement.clients.first_name} ${disbursement.clients.last_name}`
          : disbursement.recipient_name,
        balance: 0 // Will be calculated below
      }));

      // Combine and sort by date (newest first)
      const allTransactions = [...donationTransactions, ...disbursementTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate running balance (working backwards from current balance)
      let runningBalance = balance;
      const transactionsWithBalance = allTransactions.map((transaction, index) => {
        const transactionWithBalance = { ...transaction, balance: runningBalance };
        
        // Adjust balance for next iteration (working backwards)
        if (transaction.type === 'donation') {
          runningBalance -= transaction.amount;
        } else {
          runningBalance += transaction.amount;
        }
        
        return transactionWithBalance;
      });

      setTransactions(transactionsWithBalance);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Client', 'Amount', 'Balance'];
    const csvData = transactions.map(t => [
      format(new Date(t.date), 'MM/dd/yyyy'),
      t.type === 'donation' ? 'Donation' : 'Disbursement',
      t.description,
      t.client_name || '',
      t.type === 'donation' ? `+${t.amount.toFixed(2)}` : `-${t.amount.toFixed(2)}`,
      t.balance.toFixed(2)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `good-samaritan-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 10);

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Transaction Ledger
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTransactions}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Balance Header */}
            <div className="bg-muted/30 rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Balance</span>
                <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${balance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Transaction List */}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {displayedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'donation' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'donation' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {format(new Date(transaction.date), 'MM/dd/yyyy')}
                          </span>
                          <Badge 
                            variant={transaction.type === 'donation' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.type === 'donation' ? 'Donation' : 'Disbursement'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {transaction.description}
                          {transaction.client_name && ` - ${transaction.client_name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.type === 'donation' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'donation' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Balance: ${transaction.balance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {transactions.length > 10 && (
              <div className="text-center pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm"
                >
                  {showAll ? 'Show Less' : `Show All ${transactions.length} Transactions`}
                </Button>
              </div>
            )}

            {transactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found.</p>
                <p className="text-sm">Donations and disbursements will appear here.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};