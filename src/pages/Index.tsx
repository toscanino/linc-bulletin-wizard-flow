
import { useState } from "react";
import { Plus, Calendar, Users, FileText, Edit, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MultiRangeCalendar, DateRange } from "@/components/ui/multi-range-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
}

interface EVP {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  comments?: string;
  status: "draft" | "confirmed";
}

const employees: Employee[] = [
  { id: "1", name: "Marie Dubois", position: "Développeuse Senior", department: "Tech" },
  { id: "2", name: "Pierre Martin", position: "Chef de Projet", department: "Marketing" },
  { id: "3", name: "Sophie Laurent", position: "Responsable RH", department: "RH" },
  { id: "4", name: "Thomas Bernard", position: "Comptable", department: "Finance" },
];

const Index = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAltWizard, setShowAltWizard] = useState(false);
  const [evpList, setEvpList] = useState<EVP[]>([]);
  
  // Alternative wizard state with multi-range calendar
  const [selectedRanges, setSelectedRanges] = useState<DateRange[]>([]);
  const [altComments, setAltComments] = useState("");
  const [altEvpType, setAltEvpType] = useState("conges-payes");
  const [lockedMonth] = useState(new Date(2025, 5, 1)); // June 2025

  const calculateRangeDays = () => {
    return selectedRanges.reduce((total, range) => {
      if (range.from.getTime() === range.to.getTime()) {
        // Single day
        if (range.dayType === "half-morning" || range.dayType === "half-afternoon") {
          return total + 0.5;
        } else {
          return total + 1;
        }
      } else {
        // Range of days - calculate inclusive day count
        const timeDiff = range.to.getTime() - range.from.getTime();
        const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        return total + daysDiff + 1; // +1 because we want inclusive count
      }
    }, 0);
  };

  const rangeDays = calculateRangeDays();
  // Fix: Use the actual number of ranges after merging, not before
  const rangePeriods = selectedRanges.length;

  const handleAddAltEVP = () => {
    if (selectedEmployee && selectedRanges.length > 0) {
      // Create an EVP for each range
      const newEVPs = selectedRanges.map((range, index) => {
        let days: number;
        if (range.from.getTime() === range.to.getTime()) {
          // Single day
          days = (range.dayType === "half-morning" || range.dayType === "half-afternoon") ? 0.5 : 1;
        } else {
          // Range of days - calculate inclusive day count
          const timeDiff = range.to.getTime() - range.from.getTime();
          const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
          days = daysDiff + 1; // +1 because we want inclusive count
        }

        return {
          id: `${Date.now()}-${index}`,
          employeeId: selectedEmployee.id,
          type: altEvpType,
          startDate: range.from.toISOString().split('T')[0],
          endDate: range.to.toISOString().split('T')[0],
          days,
          comments: altComments,
          status: "confirmed" as const
        };
      });
      
      setEvpList([...evpList, ...newEVPs]);
      resetAltWizard();
    }
  };

  const resetAltWizard = () => {
    setShowAltWizard(false);
    setSelectedRanges([]);
    setAltComments("");
    setAltEvpType("conges-payes");
  };

  const openAltWizard = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAltWizard(true);
  };

  const deleteEVP = (evpId: string) => {
    setEvpList(evpList.filter(evp => evp.id !== evpId));
  };

  const getEVPsForEmployee = (employeeId: string) => {
    return evpList.filter(evp => evp.employeeId === employeeId);
  };

  const getEVPTypeLabel = (type: string) => {
    switch (type) {
      case "conges-payes": return "Congés payés";
      case "heures-sup": return "Heures supplémentaires";
      case "prime": return "Prime";
      default: return type;
    }
  };

  const formatDaysCounter = (days: number, periods: number) => {
    if (days === 0) return "";
    
    const daysText = days === Math.floor(days) ? `${days} jour${days > 1 ? 's' : ''}` : `${days} jour${days > 1 ? 's' : ''}`;
    
    if (periods <= 1) {
      return daysText;
    } else {
      return `${daysText} répartis sur ${periods} période${periods > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Bulletins de paie</h1>
              <p className="text-sm text-muted-foreground mt-1">Gestion des éléments variables - Décembre 2024</p>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Linc Payroll</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Employee List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employees.map((employee) => {
                  const employeeEVPs = getEVPsForEmployee(employee.id);
                  return (
                    <div
                      key={employee.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${
                        selectedEmployee?.id === employee.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm">{employee.name}</h3>
                          <p className="text-xs text-muted-foreground">{employee.position}</p>
                          <p className="text-xs text-muted-foreground">{employee.department}</p>
                        </div>
                        {employeeEVPs.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {employeeEVPs.length} EVP
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* EVP Management */}
          <div className="lg:col-span-2">
            {selectedEmployee ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{selectedEmployee.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Éléments Variables de Paie</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => openAltWizard(selectedEmployee)} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Renseigner un événement de paie
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {getEVPsForEmployee(selectedEmployee.id).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun élément variable pour ce mois</p>
                      <p className="text-sm">Cliquez sur "Renseigner un événement de paie" pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getEVPsForEmployee(selectedEmployee.id).map((evp) => (
                        <div key={evp.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{getEVPTypeLabel(evp.type)}</Badge>
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirmé
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Période:</span>
                                  <p className="font-medium">
                                    {new Date(evp.startDate).toLocaleDateString('fr-FR')} - {new Date(evp.endDate).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Durée:</span>
                                  <p className="font-medium">{evp.days} jour{evp.days > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              {evp.comments && (
                                <div className="mt-2">
                                  <span className="text-muted-foreground text-sm">Commentaires:</span>
                                  <p className="text-sm">{evp.comments}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteEVP(evp.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Sélectionnez un employé pour gérer ses éléments variables</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Alternative Quick Wizard Modal with Multi-Range Calendar */}
      <Dialog open={showAltWizard} onOpenChange={(open) => !open && resetAltWizard()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Renseigner un événement de paie</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Employé: <span className="font-medium">{selectedEmployee?.name}</span>
            </p>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Event Type Selection */}
            <div className="space-y-4">
              <Label>Type d'élément variable</Label>
              <Select value={altEvpType} onValueChange={setAltEvpType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conges-payes">Congés payés</SelectItem>
                  <SelectItem value="heures-sup">Heures supplémentaires</SelectItem>
                  <SelectItem value="prime">Prime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period Selection with Locked Month */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Période de paie</Label>
                <Badge variant="outline" className="text-xs">
                  {format(lockedMonth, "MMMM yyyy", { locale: fr })}
                </Badge>
              </div>
              
              <MultiRangeCalendar
                selectedRanges={selectedRanges}
                onRangesChange={setSelectedRanges}
                lockedMonth={lockedMonth}
                className="border rounded-lg"
              />
              
              {/* Counter/Recap */}
              {rangeDays > 0 && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-center">
                    {formatDaysCounter(rangeDays, rangePeriods)} - {getEVPTypeLabel(altEvpType)}
                  </p>
                </div>
              )}
            </div>

            {/* Optional Comments */}
            <div>
              <Label htmlFor="alt-comments">Commentaires (optionnel)</Label>
              <Textarea
                id="alt-comments"
                placeholder="Ajoutez une note si nécessaire..."
                value={altComments}
                onChange={(e) => setAltComments(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={resetAltWizard}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddAltEVP}
              disabled={selectedRanges.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Ajouter l'élément
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
